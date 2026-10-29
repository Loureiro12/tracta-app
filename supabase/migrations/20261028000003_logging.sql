-- =============================================================================
-- Logging: strength sessions, GPS/other activities and body measurements.
-- Totals and personal records are derived (views), never stored.
-- =============================================================================

create type public.activity_kind as enum (
  'run', 'walk', 'bike', 'swim', 'soccer', 'basket', 'tennis', 'functional', 'stretch', 'yoga'
);
create type public.data_source as enum ('manual', 'health');

-- -----------------------------------------------------------------------------
-- workout_sessions + session_sets
-- -----------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  -- snapshot of the routine name at the time ("Treino A"), kept if the routine is deleted
  title text not null check (char_length(btrim(title)) between 1 and 60),
  focus text not null default '',
  started_at timestamptz not null,
  ended_at timestamptz not null,
  paused_seconds integer not null default 0 check (paused_seconds >= 0),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  constraint workout_sessions_time_order check (ended_at >= started_at)
);
create index workout_sessions_owner_started_idx on public.workout_sessions (owner_id, started_at desc);

create table public.session_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  -- order of the exercise inside the session and of the set inside the exercise
  exercise_position smallint not null check (exercise_position >= 0),
  set_index smallint not null check (set_index >= 0),
  kg numeric(6, 2) check (kg is null or kg >= 0),
  reps smallint not null check (reps between 0 and 600),
  -- warm-up sets (40/60/80 %) never count toward volume or records
  is_warmup boolean not null default false,
  superset text,
  constraint session_sets_unique unique (session_id, exercise_position, set_index, is_warmup)
);
create index session_sets_session_idx on public.session_sets (session_id);
create index session_sets_exercise_idx on public.session_sets (exercise_id);

-- -----------------------------------------------------------------------------
-- activities: run, walk, bike, swim and the other modalities.
-- -----------------------------------------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.activity_kind not null,
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 1 and 172800),
  -- meters; null for modalities without distance (yoga, soccer…)
  distance_m integer check (distance_m is null or distance_m >= 0),
  gps boolean not null default false,
  -- [{ "km": 1, "seconds": 334 }, …]; the last split may be partial (km < 1)
  splits jsonb not null default '[]' check (jsonb_typeof(splits) = 'array'),
  -- interval plan used, if any: { reps, workSec, restSec, warmSec }
  intervals jsonb check (intervals is null or jsonb_typeof(intervals) = 'object'),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);
create index activities_owner_started_idx on public.activities (owner_id, started_at desc);

-- -----------------------------------------------------------------------------
-- body_measurements: manual log (and, later, values imported from Health).
-- -----------------------------------------------------------------------------
create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null default current_date,
  weight_kg numeric(5, 2) check (weight_kg is null or weight_kg between 20 and 400),
  waist_cm numeric(5, 1) check (waist_cm is null or waist_cm between 30 and 250),
  hip_cm numeric(5, 1) check (hip_cm is null or hip_cm between 30 and 250),
  arm_cm numeric(5, 1) check (arm_cm is null or arm_cm between 10 and 100),
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  constraint body_measurements_one_per_day unique (owner_id, measured_on, source),
  constraint body_measurements_not_empty check (num_nonnulls(weight_kg, waist_cm, hip_cm, arm_cm) > 0)
);

-- -----------------------------------------------------------------------------
-- RLS: everything is private to its owner (social sharing uses daily summaries).
-- -----------------------------------------------------------------------------
alter table public.workout_sessions enable row level security;
alter table public.session_sets enable row level security;
alter table public.activities enable row level security;
alter table public.body_measurements enable row level security;

create policy "workout_sessions: owner" on public.workout_sessions
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "session_sets: via session" on public.session_sets
  for all to authenticated
  using (exists (select 1 from public.workout_sessions s where s.id = session_id and s.owner_id = (select auth.uid())))
  with check (
    exists (select 1 from public.workout_sessions s where s.id = session_id and s.owner_id = (select auth.uid()))
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and (e.owner_id is null or e.owner_id = (select auth.uid()))
    )
  );

create policy "activities: owner" on public.activities
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy "body_measurements: owner" on public.body_measurements
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

revoke all on public.workout_sessions, public.session_sets, public.activities, public.body_measurements from anon;

-- -----------------------------------------------------------------------------
-- Derived views (security_invoker: RLS of the caller applies).
-- -----------------------------------------------------------------------------
create view public.session_totals with (security_invoker = true) as
select
  s.id as session_id,
  s.owner_id,
  s.started_at,
  greatest(0, extract(epoch from (s.ended_at - s.started_at))::integer - s.paused_seconds) as duration_seconds,
  count(ss.id) filter (where not ss.is_warmup)::integer as sets,
  coalesce(sum(ss.reps) filter (where not ss.is_warmup), 0)::integer as reps,
  coalesce(sum(ss.kg * ss.reps) filter (where not ss.is_warmup and ss.kg is not null), 0)::numeric(10, 2) as volume_kg
from public.workout_sessions s
left join public.session_sets ss on ss.session_id = s.id
group by s.id;

-- Best working set per exercise (heaviest load, then most reps) with when it happened.
create view public.personal_records with (security_invoker = true) as
select distinct on (s.owner_id, ss.exercise_id)
  s.owner_id,
  ss.exercise_id,
  ss.kg,
  ss.reps,
  s.id as session_id,
  s.started_at as achieved_at
from public.session_sets ss
join public.workout_sessions s on s.id = ss.session_id
where not ss.is_warmup and ss.reps > 0
order by s.owner_id, ss.exercise_id, ss.kg desc nulls last, ss.reps desc, s.started_at asc;

-- -----------------------------------------------------------------------------
-- save_workout_session: insert a finished session and all its sets atomically.
-- payload = {
--   routineId?, title, focus?, startedAt, endedAt, pausedSeconds?, notes?,
--   sets: [{ exerciseId, exercisePosition, setIndex, kg|null, reps, isWarmup?, superset? }]
-- }
-- Runs as the caller (security invoker), so RLS validates ownership of everything.
-- -----------------------------------------------------------------------------
create or replace function public.save_workout_session(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if jsonb_typeof(payload -> 'sets') is distinct from 'array' then
    raise exception 'sets must be an array' using errcode = '22023';
  end if;

  insert into public.workout_sessions (routine_id, title, focus, started_at, ended_at, paused_seconds, notes)
  values (
    nullif(payload ->> 'routineId', '')::uuid,
    payload ->> 'title',
    coalesce(payload ->> 'focus', ''),
    (payload ->> 'startedAt')::timestamptz,
    (payload ->> 'endedAt')::timestamptz,
    coalesce((payload ->> 'pausedSeconds')::integer, 0),
    coalesce(payload ->> 'notes', '')
  )
  returning id into new_id;

  insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps, is_warmup, superset)
  select
    new_id,
    (s ->> 'exerciseId')::uuid,
    (s ->> 'exercisePosition')::smallint,
    (s ->> 'setIndex')::smallint,
    (s ->> 'kg')::numeric,
    (s ->> 'reps')::smallint,
    coalesce((s ->> 'isWarmup')::boolean, false),
    nullif(s ->> 'superset', '')
  from jsonb_array_elements(payload -> 'sets') as s;

  return new_id;
end;
$$;

-- Sets of the most recent session that included each exercise ("anterior 60×8").
create or replace function public.last_sets(exercise_ids uuid[])
returns table (exercise_id uuid, set_index smallint, kg numeric, reps smallint, performed_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  with latest as (
    select distinct on (ss.exercise_id) ss.exercise_id, ss.session_id, s.started_at
    from public.session_sets ss
    join public.workout_sessions s on s.id = ss.session_id
    where ss.exercise_id = any (exercise_ids) and not ss.is_warmup
    order by ss.exercise_id, s.started_at desc
  )
  select ss.exercise_id, ss.set_index, ss.kg, ss.reps, l.started_at
  from latest l
  join public.session_sets ss on ss.session_id = l.session_id and ss.exercise_id = l.exercise_id
  where not ss.is_warmup
  order by ss.exercise_id, ss.set_index;
$$;

grant execute on function public.save_workout_session(jsonb) to authenticated;
grant execute on function public.last_sets(uuid[]) to authenticated;
revoke execute on function public.save_workout_session(jsonb) from anon, public;
revoke execute on function public.last_sets(uuid[]) from anon, public;
