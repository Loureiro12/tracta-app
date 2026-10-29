-- =============================================================================
-- Social: friendships, daily summaries shared with friends, challenges, cheers.
-- Raw sessions stay private; friends only see a daily summary filtered by the
-- owner's sharing switches (user_settings.share_*).
-- =============================================================================

create type public.friend_status as enum ('pending', 'accepted');
create type public.challenge_kind as enum ('day', 'minutes', 'steps');

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  status public.friend_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint friend_requests_not_self check (from_id <> to_id)
);
-- one relationship per pair, whatever the direction
create unique index friend_requests_pair_idx
  on public.friend_requests (least(from_id, to_id), greatest(from_id, to_id));
create index friend_requests_to_idx on public.friend_requests (to_id, status);

create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.friend_requests
    where status = 'accepted'
      and ((from_id = a and to_id = b) or (from_id = b and to_id = a))
  );
$$;

-- Profiles become visible to friends and to the other side of a pending request.
create policy "profiles: friends and requests read" on public.profiles
  for select to authenticated
  using (
    exists (
      select 1 from public.friend_requests fr
      where (fr.from_id = (select auth.uid()) and fr.to_id = profiles.id)
         or (fr.to_id = (select auth.uid()) and fr.from_id = profiles.id)
    )
  );

-- Look a user up by @handle before inviting (returns nothing for unknown handles).
create or replace function public.find_profile(p_handle text)
returns table (id uuid, name text, handle text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.name, p.handle::text
  from public.profiles p
  where p.handle = lower(ltrim(btrim(p_handle), '@'))::extensions.citext
    and p.id <> auth.uid();
$$;

-- Send a request by handle. If the other person already invited me, accept instead.
create or replace function public.send_friend_request(p_handle text)
returns public.friend_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  target uuid;
  existing public.friend_requests;
  result public.friend_requests;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  select p.id into target from public.profiles p
  where p.handle = lower(ltrim(btrim(p_handle), '@'))::extensions.citext;
  if target is null then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;
  if target = me then
    raise exception 'cannot invite yourself' using errcode = '22023';
  end if;

  select * into existing from public.friend_requests fr
  where least(fr.from_id, fr.to_id) = least(me, target)
    and greatest(fr.from_id, fr.to_id) = greatest(me, target);

  if existing.id is not null then
    if existing.status = 'pending' and existing.to_id = me then
      update public.friend_requests set status = 'accepted', responded_at = now()
      where id = existing.id returning * into result;
      return result;
    end if;
    return existing;
  end if;

  insert into public.friend_requests (from_id, to_id) values (me, target) returning * into result;
  return result;
end;
$$;

create table public.daily_summaries (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  active_minutes integer not null default 0 check (active_minutes between 0 and 1440),
  steps integer not null default 0 check (steps between 0 and 200000),
  workouts smallint not null default 0 check (workouts >= 0),
  -- short description of the day's main activity ("Treino A · 52 min")
  what text check (what is null or char_length(what) <= 80),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create trigger daily_summaries_set_updated_at
  before update on public.daily_summaries
  for each row execute function public.set_updated_at();

-- Friends' days for a date range, masked by each friend's sharing switches.
create or replace function public.friend_days(p_from date, p_to date)
returns table (user_id uuid, name text, day date, done boolean, active_minutes integer, steps integer, what text)
language sql
stable
security definer
set search_path = ''
as $$
  select d.user_id, p.name, d.day,
    case when st.share_done then d.workouts > 0 else null end,
    d.active_minutes,
    d.steps,
    case when st.share_kind then d.what else null end
  from public.daily_summaries d
  join public.profiles p on p.id = d.user_id
  join public.user_settings st on st.user_id = d.user_id
  where d.day between p_from and p_to
    and st.visibility <> 'me'
    and public.are_friends(auth.uid(), d.user_id);
$$;

-- -----------------------------------------------------------------------------
-- Challenges
-- -----------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  kind public.challenge_kind not null,
  -- minimum per day: minutes for 'day'/'minutes', steps for 'steps'
  min_value integer not null default 20 check (min_value between 0 and 100000),
  days smallint not null check (days in (7, 14, 30)),
  starts_on date not null default current_date,
  created_at timestamptz not null default now()
);

create table public.challenge_members (
  challenge_id uuid not null references public.challenges (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);
create index challenge_members_user_idx on public.challenge_members (user_id);

create or replace function public.is_challenge_member(p_challenge uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.challenge_members where challenge_id = p_challenge and user_id = p_user);
$$;

-- The creator is always a member.
create or replace function public.add_challenge_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.challenge_members (challenge_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger on_challenge_created
  after insert on public.challenges
  for each row execute function public.add_challenge_owner();

-- -----------------------------------------------------------------------------
-- Cheers ("torcer") for a friend's day.
-- -----------------------------------------------------------------------------
create table public.cheers (
  from_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  to_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  primary key (from_id, to_id, day),
  constraint cheers_not_self check (from_id <> to_id)
);

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.friend_requests enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
alter table public.cheers enable row level security;

create policy "friend_requests: parties read" on public.friend_requests
  for select to authenticated using ((select auth.uid()) in (from_id, to_id));
-- only the recipient answers (accept); either side can remove (decline / unfriend / cancel)
create policy "friend_requests: recipient accepts" on public.friend_requests
  for update to authenticated using (to_id = (select auth.uid())) with check (to_id = (select auth.uid()));
create policy "friend_requests: parties delete" on public.friend_requests
  for delete to authenticated using ((select auth.uid()) in (from_id, to_id));

create policy "daily_summaries: owner" on public.daily_summaries
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "challenges: members read" on public.challenges
  for select to authenticated using (public.is_challenge_member(id, (select auth.uid())));
create policy "challenges: owner creates" on public.challenges
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "challenges: owner updates" on public.challenges
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "challenges: owner deletes" on public.challenges
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "challenge_members: co-members read" on public.challenge_members
  for select to authenticated using (public.is_challenge_member(challenge_id, (select auth.uid())));
-- the owner adds friends; nobody adds strangers
create policy "challenge_members: owner adds friends" on public.challenge_members
  for insert to authenticated
  with check (
    exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid()))
    and public.are_friends((select auth.uid()), user_id)
  );
-- members leave by themselves; the owner can remove anyone
create policy "challenge_members: leave or remove" on public.challenge_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or exists (select 1 from public.challenges c where c.id = challenge_id and c.owner_id = (select auth.uid()))
  );

create policy "cheers: parties read" on public.cheers
  for select to authenticated using ((select auth.uid()) in (from_id, to_id));
create policy "cheers: friends send" on public.cheers
  for insert to authenticated
  with check (from_id = (select auth.uid()) and public.are_friends(from_id, to_id));
create policy "cheers: sender removes" on public.cheers
  for delete to authenticated using (from_id = (select auth.uid()));

revoke all on public.friend_requests, public.daily_summaries, public.challenges,
  public.challenge_members, public.cheers from anon;
-- requests are created through send_friend_request(); direct inserts are not allowed
revoke insert on public.friend_requests from authenticated;
-- the only column a recipient may change is the status
revoke update on public.friend_requests from authenticated;
grant update (status, responded_at) on public.friend_requests to authenticated;

grant execute on function public.find_profile(text), public.send_friend_request(text),
  public.friend_days(date, date), public.are_friends(uuid, uuid) to authenticated;
revoke execute on function public.find_profile(text), public.send_friend_request(text),
  public.friend_days(date, date), public.are_friends(uuid, uuid),
  public.is_challenge_member(uuid, uuid) from anon, public;
