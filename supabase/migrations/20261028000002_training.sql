-- =============================================================================
-- Training plan: exercise library, routines, programs and race goal.
-- =============================================================================

-- How an exercise is logged: load × reps, reps only (bodyweight) or time (minutes).
create type public.exercise_kind as enum ('load_reps', 'reps', 'time');

-- -----------------------------------------------------------------------------
-- exercises: built-in library (owner_id is null) + user custom exercises.
-- -----------------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete cascade,
  -- stable URL-safe key used by the app ("supino-reto-com-barra")
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 2 and 60),
  muscle_group text not null,
  secondary_groups text[] not null default '{}',
  equipment text not null,
  kind public.exercise_kind not null default 'load_reps',
  default_kg numeric(6, 2) check (default_kg is null or default_kg >= 0),
  -- reps, or minutes when kind = 'time'
  default_reps smallint not null default 10 check (default_reps between 1 and 600),
  default_rest_seconds smallint not null default 90 check (default_rest_seconds between 0 and 900),
  instructions text not null default '',
  created_at timestamptz not null default now(),
  constraint exercises_slug_unique unique nulls not distinct (owner_id, slug)
);
create index exercises_owner_idx on public.exercises (owner_id);

-- Per-user favorite flag and private notes on any exercise (built-in or custom).
create table public.exercise_prefs (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  favorite boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 500),
  updated_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

create trigger exercise_prefs_set_updated_at
  before update on public.exercise_prefs
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- routines (Treino A/B/C…) and their prescribed exercises.
-- -----------------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- short badge shown in the UI ("A")
  label text not null check (char_length(label) between 1 and 2),
  name text not null check (char_length(btrim(name)) between 1 and 40),
  focus text not null default '' check (char_length(focus) <= 60),
  -- 0 = Monday … 6 = Sunday; null = no fixed day
  weekday smallint check (weekday between 0 and 6),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routines_owner_idx on public.routines (owner_id, position);

create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position smallint not null,
  sets smallint not null check (sets between 1 and 20),
  -- reps, or minutes for time exercises
  reps smallint not null check (reps between 1 and 600),
  kg numeric(6, 2) check (kg is null or kg >= 0),
  rest_seconds smallint not null default 90 check (rest_seconds between 0 and 900),
  -- consecutive exercises sharing a key form a superset
  superset text check (superset is null or char_length(superset) <= 8),
  constraint routine_exercises_position_unique unique (routine_id, position) deferrable initially deferred
);
create index routine_exercises_routine_idx on public.routine_exercises (routine_id);
create index routine_exercises_exercise_idx on public.routine_exercises (exercise_id);

-- -----------------------------------------------------------------------------
-- programs: read-only catalog (PRO feature) + the user's active enrollment.
-- -----------------------------------------------------------------------------
create table public.programs (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  name text not null,
  weeks smallint not null check (weeks between 1 and 52),
  tag text not null,
  frequency text not null,
  description text not null,
  -- day tokens Mon..Sun: routine letter, 'F' full body, '⟶' run, '—' rest
  pattern text[] not null check (cardinality(pattern) = 7),
  legend text not null,
  week_titles text[] not null,
  light_weeks smallint[] not null default '{}',
  position smallint not null default 0
);

create table public.program_enrollments (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  program_id text not null references public.programs (id),
  started_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- races: one target race per user ("Minha prova", PRO feature).
-- -----------------------------------------------------------------------------
create table public.races (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  distance_m integer not null check (distance_m between 1000 and 100000),
  race_date date not null,
  target_seconds integer not null check (target_seconds between 600 and 86400),
  updated_at timestamptz not null default now()
);

create trigger races_set_updated_at
  before update on public.races
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.exercises enable row level security;
alter table public.exercise_prefs enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.programs enable row level security;
alter table public.program_enrollments enable row level security;
alter table public.races enable row level security;

-- Library is readable by everyone signed in; custom exercises only by their owner.
create policy "exercises: library and own" on public.exercises
  for select to authenticated using (owner_id is null or owner_id = (select auth.uid()));
create policy "exercises: create own" on public.exercises
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "exercises: update own" on public.exercises
  for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy "exercises: delete own" on public.exercises
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "exercise_prefs: owner" on public.exercise_prefs
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "routines: owner" on public.routines
  for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Routine exercises inherit the routine's owner; the exercise must be visible to that owner.
create policy "routine_exercises: via routine" on public.routine_exercises
  for all to authenticated
  using (exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = (select auth.uid())))
  with check (
    exists (select 1 from public.routines r where r.id = routine_id and r.owner_id = (select auth.uid()))
    and exists (
      select 1 from public.exercises e
      where e.id = exercise_id and (e.owner_id is null or e.owner_id = (select auth.uid()))
    )
  );

create policy "programs: catalog is public to members" on public.programs
  for select to authenticated using (true);

create policy "program_enrollments: owner" on public.program_enrollments
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "races: owner" on public.races
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

revoke all on public.exercises, public.exercise_prefs, public.routines, public.routine_exercises,
  public.programs, public.program_enrollments, public.races from anon;
