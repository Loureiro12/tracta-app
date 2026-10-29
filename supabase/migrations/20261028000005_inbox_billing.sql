-- =============================================================================
-- Inbox notifications (written by triggers / backend only), subscriptions
-- (written by the store webhook with the service role) and account deletion.
-- =============================================================================

create type public.notification_kind as enum ('workout', 'social', 'sync', 'weekly', 'record', 'goal');
create type public.subscription_plan as enum ('year', 'month');
create type public.subscription_status as enum ('trialing', 'active', 'canceled', 'expired');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  body text not null default '',
  -- in-app route opened when the item is tapped ("/social")
  href text check (href is null or href ~ '^/'),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_owner_created_idx on public.notifications (owner_id, created_at desc);

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan public.subscription_plan not null,
  status public.subscription_status not null,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.notifications enable row level security;
alter table public.subscriptions enable row level security;

create policy "notifications: owner reads" on public.notifications
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "notifications: owner marks read" on public.notifications
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "notifications: owner removes" on public.notifications
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "subscriptions: owner reads" on public.subscriptions
  for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.notifications, public.subscriptions from anon;
revoke insert, update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke insert, update, delete on public.subscriptions from authenticated;

-- -----------------------------------------------------------------------------
-- Notification triggers for social events.
-- -----------------------------------------------------------------------------
create or replace function public.notify_friend_request()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender text;
begin
  if tg_op = 'INSERT' then
    select name into sender from public.profiles where id = new.from_id;
    insert into public.notifications (owner_id, kind, title, body, href)
    values (new.to_id, 'social', sender || ' quer treinar com você', 'Aceite o convite para ver os dias um do outro.', '/social');
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    select name into sender from public.profiles where id = new.to_id;
    insert into public.notifications (owner_id, kind, title, body, href)
    values (new.from_id, 'social', sender || ' aceitou seu convite', 'Agora vocês podem criar desafios juntos.', '/social');
  end if;
  return new;
end;
$$;

create trigger on_friend_request_changed
  after insert or update on public.friend_requests
  for each row execute function public.notify_friend_request();

create or replace function public.notify_cheer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sender text;
begin
  select name into sender from public.profiles where id = new.from_id;
  insert into public.notifications (owner_id, kind, title, body, href)
  values (new.to_id, 'social', sender || ' torceu por você', 'Continue assim.', '/social');
  return new;
end;
$$;

create trigger on_cheer_created
  after insert on public.cheers
  for each row execute function public.notify_cheer();

create or replace function public.notify_challenge_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ch public.challenges;
  sender text;
begin
  select * into ch from public.challenges where id = new.challenge_id;
  if ch.owner_id = new.user_id then
    return new;
  end if;
  select name into sender from public.profiles where id = ch.owner_id;
  insert into public.notifications (owner_id, kind, title, body, href)
  values (new.user_id, 'social', sender || ' convidou você para "' || ch.name || '"', ch.days || ' dias', '/social');
  return new;
end;
$$;

create trigger on_challenge_member_added
  after insert on public.challenge_members
  for each row execute function public.notify_challenge_member();

-- -----------------------------------------------------------------------------
-- delete_account: removes the auth user; every owned row cascades.
-- -----------------------------------------------------------------------------
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_account() to authenticated;
revoke execute on function public.delete_account() from anon, public;
-- trigger functions are never called directly
revoke execute on function public.handle_new_user(), public.add_challenge_owner(), public.notify_friend_request(),
  public.notify_cheer(), public.notify_challenge_member() from anon, authenticated, public;
