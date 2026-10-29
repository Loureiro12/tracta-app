-- =============================================================================
-- Core: profiles, preferences and goals.
-- Every table is owned by a user (auth.users) and protected by RLS.
-- Rows are created by the on_auth_user_created trigger, so the app never inserts them.
-- =============================================================================

create extension if not exists citext with schema extensions;

-- Shared trigger: keep updated_at current on every UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create type public.units as enum ('kg', 'lb');
-- Who can see my workouts in the social feed: friends, only me, everyone.
create type public.visibility as enum ('friends', 'me', 'all');

-- -----------------------------------------------------------------------------
-- profiles: public identity of a user (name + handle used for invites).
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  handle extensions.citext unique check (handle ~ '^[a-z0-9_.]{3,30}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Public identity: display name and unique @handle.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_settings: app preferences that must follow the account across devices.
-- Theme and language stay on the device (settings store).
-- -----------------------------------------------------------------------------
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  units public.units not null default 'kg',
  auto_rest boolean not null default true,
  visibility public.visibility not null default 'friends',
  -- notification switches (Perfil › Notificações)
  notify_rest boolean not null default true,
  notify_sound boolean not null default true,
  notify_remind boolean not null default true,
  notify_daily boolean not null default false,
  notify_weekly boolean not null default true,
  notify_goals boolean not null default true,
  notify_sync boolean not null default true,
  -- workout reminder time, minutes after midnight (18:30 = 1110)
  reminder_minutes smallint not null default 1110 check (reminder_minutes between 0 and 1439),
  -- what friends see in challenges (Social › privacidade); loads and PRs are off by default
  share_done boolean not null default true,
  share_kind boolean not null default true,
  share_streak boolean not null default true,
  share_loads boolean not null default false,
  share_prs boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- goals: personal targets (no penalty for missing them).
-- -----------------------------------------------------------------------------
create table public.goals (
  user_id uuid primary key references auth.users (id) on delete cascade,
  steps integer not null default 10000 check (steps between 1000 and 50000),
  sleep_minutes smallint not null default 450 check (sleep_minutes between 240 and 720),
  workouts_per_week smallint not null default 4 check (workouts_per_week between 1 and 14),
  run_km smallint not null default 15 check (run_km between 0 and 300),
  updated_at timestamptz not null default now()
);

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- New account bootstrap: profile + settings + goals in the same transaction.
-- Name comes from sign-up metadata ({ name }), falling back to the e-mail prefix.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    split_part(new.email, '@', 1),
    'Tracta'
  );
begin
  insert into public.profiles (id, name) values (new.id, left(display_name, 80));
  insert into public.user_settings (user_id) values (new.id);
  insert into public.goals (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.goals enable row level security;

-- Profiles: you read your own; friendships (social migration) widen this.
create policy "profiles: owner reads" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles: owner updates" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "user_settings: owner reads" on public.user_settings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "user_settings: owner updates" on public.user_settings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "goals: owner reads" on public.goals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "goals: owner updates" on public.goals
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Inserts/deletes happen only through the trigger and auth cascade: no policies for them.
revoke insert, delete on public.profiles, public.user_settings, public.goals from anon, authenticated;
revoke all on public.profiles, public.user_settings, public.goals from anon;
