-- =============================================================================
-- Friend invites by e-mail (additive).
--   email_invites                 one row per (inviter, address); the inviter reads and revokes own
--   create_email_invite(...)      service role only (edge function invite-friend): validation,
--                                 dedupe, daily rate limit; an address that already has an account
--                                 becomes a friend request instead of an e-mail
--   revoke_email_invite(id)       the inviter cancels a pending invite
--   on_auth_user_confirmed_…      when an invited address signs up (confirmed), each pending invite
--                                 is accepted and becomes a pending friend request to the new user
-- =============================================================================

create type public.email_invite_status as enum ('pending', 'accepted', 'expired');

create table public.email_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email extensions.citext not null
    check (char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  -- opaque id carried in the invite link (attribution); never used for authorization
  token text not null default encode(extensions.gen_random_bytes(16), 'hex') unique,
  status public.email_invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  -- last time an e-mail (or friend request) went out for this row: rate limit + expiry
  last_sent_at timestamptz not null default now(),
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  constraint email_invites_inviter_email_key unique (inviter_id, email)
);
create index email_invites_pending_email_idx on public.email_invites (email) where status = 'pending';
create index email_invites_inviter_sent_idx on public.email_invites (inviter_id, last_sent_at desc);
comment on table public.email_invites is 'Friend invites sent by e-mail; created by the invite-friend edge function.';

alter table public.email_invites enable row level security;

create policy "email_invites: inviter reads" on public.email_invites
  for select to authenticated using (inviter_id = (select auth.uid()));

revoke all on public.email_invites from anon, authenticated;
grant select on public.email_invites to authenticated;

-- Internal: friend request p_from → p_to with the send_friend_request() semantics (accepts when
-- p_to already invited p_from, keeps an existing relationship untouched).
create or replace function public.request_friendship(p_from uuid, p_to uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing public.friend_requests;
begin
  if p_from is null or p_to is null or p_from = p_to then
    return;
  end if;
  select * into existing from public.friend_requests fr
  where least(fr.from_id, fr.to_id) = least(p_from, p_to)
    and greatest(fr.from_id, fr.to_id) = greatest(p_from, p_to);
  if existing.id is null then
    insert into public.friend_requests (from_id, to_id) values (p_from, p_to) on conflict do nothing;
  elsif existing.status = 'pending' and existing.to_id = p_from then
    update public.friend_requests set status = 'accepted', responded_at = now() where id = existing.id;
  end if;
end;
$$;

-- Called by the edge function with the service role after authenticating the caller.
-- Returns `send = true` only when an invite e-mail must go out; the caller's response must not
-- depend on it (no account enumeration).
create or replace function public.create_email_invite(p_inviter uuid, p_email text)
returns table (invite_id uuid, token text, send boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  addr extensions.citext := lower(btrim(coalesce(p_email, '')))::extensions.citext;
  daily_limit constant integer := 20;
  inv public.email_invites;
  target uuid;
begin
  if p_inviter is null or not exists (select 1 from auth.users where id = p_inviter) then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if char_length(addr) > 254 or addr !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid e-mail' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users where id = p_inviter and lower(email) = addr) then
    raise exception 'cannot invite yourself' using errcode = '22023';
  end if;

  -- Pending invites expire after 30 days without an answer.
  update public.email_invites set status = 'expired'
  where inviter_id = p_inviter and status = 'pending' and last_sent_at < now() - interval '30 days';

  select * into inv from public.email_invites e
  where e.inviter_id = p_inviter and e.email = addr
  for update;

  -- Dedupe: an open or answered invite is not sent again.
  if inv.id is not null and inv.status in ('pending', 'accepted') then
    return query select inv.id, inv.token, false;
    return;
  end if;
  -- A revoked/expired invite comes back, but the same address gets at most one e-mail a day.
  if inv.id is not null and inv.last_sent_at > now() - interval '1 day' then
    update public.email_invites set status = 'pending' where id = inv.id returning * into inv;
    return query select inv.id, inv.token, false;
    return;
  end if;

  if (select count(*) from public.email_invites e
      where e.inviter_id = p_inviter and e.last_sent_at > now() - interval '1 day') >= daily_limit then
    raise exception 'too many invites today' using errcode = '53400';
  end if;

  select u.id into target from auth.users u
  where lower(u.email) = addr and u.email_confirmed_at is not null;

  insert into public.email_invites as e (inviter_id, email, status, last_sent_at, accepted_by, accepted_at)
  values (
    p_inviter, addr,
    case when target is null then 'pending' else 'accepted' end::public.email_invite_status,
    now(), target, case when target is null then null else now() end
  )
  on conflict (inviter_id, email) do update
    set status = excluded.status,
        token = encode(extensions.gen_random_bytes(16), 'hex'),
        last_sent_at = now(),
        accepted_by = excluded.accepted_by,
        accepted_at = excluded.accepted_at
  returning * into inv;

  if target is not null then
    -- The address already has an account: a friend request instead of an e-mail.
    perform public.request_friendship(p_inviter, target);
  end if;

  return query select inv.id, inv.token, target is null;
end;
$$;

-- The inviter cancels a pending invite (kept as 'expired' so the daily limit still counts it).
create or replace function public.revoke_email_invite(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  update public.email_invites set status = 'expired'
  where id = p_id and inviter_id = auth.uid() and status = 'pending';
  if not found then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;
end;
$$;

-- Sign-up of an invited address (confirmed on insert, or later when the e-mail is confirmed):
-- every pending invite is accepted and the inviter's friend request reaches the new user.
create or replace function public.link_email_invites()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv record;
begin
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.email_confirmed_at is not null then
    return new;
  end if;
  for inv in
    select e.id, e.inviter_id from public.email_invites e
    where e.email = lower(new.email)::extensions.citext and e.status = 'pending'
      and e.last_sent_at >= now() - interval '30 days'
    for update
  loop
    perform public.request_friendship(inv.inviter_id, new.id);
    update public.email_invites set status = 'accepted', accepted_by = new.id, accepted_at = now()
    where id = inv.id;
  end loop;
  return new;
end;
$$;

-- Named after on_auth_user_created so it runs once the profile exists.
create trigger on_auth_user_confirmed_link_invites
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.link_email_invites();

grant execute on function public.revoke_email_invite(uuid) to authenticated;
grant execute on function public.create_email_invite(uuid, text) to service_role;
revoke execute on function public.revoke_email_invite(uuid) from anon, public;
revoke execute on function public.create_email_invite(uuid, text), public.request_friendship(uuid, uuid),
  public.link_email_invites() from anon, authenticated, public;
