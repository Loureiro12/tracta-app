-- =============================================================================
-- Health: daily aggregates read on the device (Apple Health / Health Connect) and synced here.
--   * health_connections: one row per user while a Health source is connected (+ last sync).
--   * health_days: one row per user and local calendar day. Sleep belongs to the day the user
--     woke up (the night of Oct 25 → 26 is stored on Oct 26). Null = no reading for that metric.
--   * upsert_health_days(): batch upsert used by the app's sync; stamps last_synced_at.
--   * daily_summaries.steps follows health_days.steps (friends' feed and challenges read it).
-- =============================================================================

create table public.health_connections (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  source text not null check (source in ('apple_health', 'health_connect')),
  -- data types the user allowed (the app's keys: steps, distance, active, resting, heart, sleep, workouts)
  read_types text[] not null default '{}' check (cardinality(read_types) <= 16),
  write_types text[] not null default '{}' check (cardinality(write_types) <= 16),
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create table public.health_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  source text not null check (source in ('apple_health', 'health_connect')),
  -- movement
  steps integer check (steps between 0 and 200000),
  distance_m integer check (distance_m between 0 and 1000000),
  active_kcal integer check (active_kcal between 0 and 20000),
  rest_kcal integer check (rest_kcal between 0 and 20000),
  active_minutes integer check (active_minutes between 0 and 1440),
  intense_minutes integer check (intense_minutes between 0 and 1440),
  -- steps per local hour (0h … 23h)
  steps_hourly integer[] check (steps_hourly is null or cardinality(steps_hourly) = 24),
  -- sleep (night ending on this day)
  sleep_minutes integer check (sleep_minutes between 0 and 1440),
  in_bed_minutes integer check (in_bed_minutes between 0 and 1440),
  awake_minutes integer check (awake_minutes between 0 and 1440),
  wakeups smallint check (wakeups between 0 and 200),
  bedtime timestamptz,
  wake_time timestamptz,
  -- hypnogram: [["light", 18], ["deep", 42], …] in chronological order
  sleep_stages jsonb check (sleep_stages is null or jsonb_typeof(sleep_stages) = 'array'),
  -- heart rate
  resting_hr smallint check (resting_hr between 20 and 250),
  hr_min smallint check (hr_min between 20 and 250),
  hr_max smallint check (hr_max between 20 and 250),
  -- average bpm per local hour, null where there was no reading
  hr_hourly smallint[] check (hr_hourly is null or cardinality(hr_hourly) = 24),
  synced_at timestamptz not null default now(),
  primary key (user_id, day),
  constraint health_days_sleep_order check (bedtime is null or wake_time is null or wake_time >= bedtime)
);

alter table public.health_connections enable row level security;
alter table public.health_days enable row level security;

create policy "health_connections: owner" on public.health_connections
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "health_days: owner" on public.health_days
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.health_connections, public.health_days from anon;

-- -----------------------------------------------------------------------------
-- daily_summaries.steps mirrors health_days.steps. Removing a health day zeroes the steps and
-- drops the summary when nothing else (workouts) is left on it.
-- -----------------------------------------------------------------------------
create or replace function public.sync_health_steps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (old.user_id, old.day) is distinct from (new.user_id, new.day)) then
    update public.daily_summaries set steps = 0 where user_id = old.user_id and day = old.day;
    delete from public.daily_summaries
      where user_id = old.user_id and day = old.day and steps = 0 and workouts = 0;
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    -- The user may be going away in this very statement (account deletion cascades).
    if not exists (select 1 from auth.users where id = new.user_id) then
      return null;
    end if;
    insert into public.daily_summaries (user_id, day, steps)
    values (new.user_id, new.day, coalesce(new.steps, 0))
    on conflict (user_id, day) do update set steps = excluded.steps
      where public.daily_summaries.steps is distinct from excluded.steps;
  end if;
  return null;
end;
$$;

-- daily_summaries.updated_at is shown as "last trained at": a steps sync must not move it.
drop trigger daily_summaries_set_updated_at on public.daily_summaries;
create trigger daily_summaries_set_updated_at
  before update on public.daily_summaries
  for each row
  when ((old.workouts, old.active_minutes, old.what) is distinct from (new.workouts, new.active_minutes, new.what))
  execute function public.set_updated_at();

create trigger health_days_sync_steps
  after insert or update or delete on public.health_days
  for each row execute function public.sync_health_steps();

-- -----------------------------------------------------------------------------
-- upsert_health_days(source, days): one round trip per sync. `days` is an array of objects with
-- the health_days column names (missing keys = null). Days already stored are replaced (the
-- device is the source of truth for them). Requires a connection; returns the sync instant.
-- -----------------------------------------------------------------------------
create or replace function public.upsert_health_days(p_source text, p_days jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(p_days) is distinct from 'array' or jsonb_array_length(p_days) > 120 then
    raise exception 'p_days must be an array of at most 120 days' using errcode = '22023';
  end if;
  if not exists (select 1 from public.health_connections where user_id = v_user) then
    raise exception 'health is not connected' using errcode = 'P0002';
  end if;

  insert into public.health_days (
    user_id, day, source, steps, distance_m, active_kcal, rest_kcal, active_minutes, intense_minutes,
    steps_hourly, sleep_minutes, in_bed_minutes, awake_minutes, wakeups, bedtime, wake_time,
    sleep_stages, resting_hr, hr_min, hr_max, hr_hourly, synced_at
  )
  select v_user, d.day, p_source, d.steps, d.distance_m, d.active_kcal, d.rest_kcal, d.active_minutes,
    d.intense_minutes, d.steps_hourly, d.sleep_minutes, d.in_bed_minutes, d.awake_minutes, d.wakeups,
    d.bedtime, d.wake_time, d.sleep_stages, d.resting_hr, d.hr_min, d.hr_max, d.hr_hourly, v_now
  from jsonb_to_recordset(p_days) as d (
    day date, steps integer, distance_m integer, active_kcal integer, rest_kcal integer,
    active_minutes integer, intense_minutes integer, steps_hourly integer[], sleep_minutes integer,
    in_bed_minutes integer, awake_minutes integer, wakeups smallint, bedtime timestamptz,
    wake_time timestamptz, sleep_stages jsonb, resting_hr smallint, hr_min smallint, hr_max smallint,
    hr_hourly smallint[]
  )
  on conflict (user_id, day) do update set
    source = excluded.source,
    steps = excluded.steps,
    distance_m = excluded.distance_m,
    active_kcal = excluded.active_kcal,
    rest_kcal = excluded.rest_kcal,
    active_minutes = excluded.active_minutes,
    intense_minutes = excluded.intense_minutes,
    steps_hourly = excluded.steps_hourly,
    sleep_minutes = excluded.sleep_minutes,
    in_bed_minutes = excluded.in_bed_minutes,
    awake_minutes = excluded.awake_minutes,
    wakeups = excluded.wakeups,
    bedtime = excluded.bedtime,
    wake_time = excluded.wake_time,
    sleep_stages = excluded.sleep_stages,
    resting_hr = excluded.resting_hr,
    hr_min = excluded.hr_min,
    hr_max = excluded.hr_max,
    hr_hourly = excluded.hr_hourly,
    synced_at = excluded.synced_at;

  update public.health_connections set source = p_source, last_synced_at = v_now where user_id = v_user;
  return v_now;
end;
$$;

revoke execute on function public.upsert_health_days(text, jsonb) from public, anon;
grant execute on function public.upsert_health_days(text, jsonb) to authenticated;
