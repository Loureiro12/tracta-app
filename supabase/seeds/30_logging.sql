-- =============================================================================
-- Demo logging history of lucas@tracta.app (History tab, Saúde › Corpo, records).
-- Dates are São Paulo local times; E2E freezes "today" to Mon 2026-10-26.
--   * strength: Treino A/B/C, 8 sessions each in the last 12 weeks (the evolution window).
--     October has 8 sessions (A 5/12/19, B 7/14/21, C 16/23) → with 6 runs = 14 workouts.
--     Oct 19 (Treino A): 18:41–19:42, 16 sets, 157 reps, 4.575 kg.
--   * runs: Sep 29 + 6 in October (38,4 km; Oct 24 = 8,2 km · 45:41 · 5:34 /km · 154 bpm),
--     plus June/July long runs that hold the run records (5 km 27:41, 10 km 58:12, 12,4 km).
--   * body: scale weigh-ins via Health (last: 78,1 kg on Oct 25) and manual tape measures.
-- Loaders are replayed by seed.reset_demo(), which wipes the demo rows first.
-- =============================================================================

-- Inserts one finished session of a demo routine. p_sets = [[exercise_position, set_index, kg|null, reps], …]
-- (exercise_position indexes the routine's exercises in order).
create or replace function seed.logging_session(p_label text, p_start timestamp, p_minutes integer, p_sets jsonb)
returns uuid
language plpgsql
as $$
declare
  r public.routines%rowtype;
  new_id uuid;
  started timestamptz := p_start at time zone 'America/Sao_Paulo';
begin
  select * into r from public.routines where id = seed.demo_routine(p_label);
  insert into public.workout_sessions (owner_id, routine_id, title, focus, started_at, ended_at)
  values (seed.demo_user(), r.id, r.name, r.focus, started, started + make_interval(mins => p_minutes))
  returning id into new_id;
  insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps, superset)
  select new_id, re.exercise_id, (s ->> 0)::smallint, (s ->> 1)::smallint, (s ->> 2)::numeric, (s ->> 3)::smallint, re.superset
  from jsonb_array_elements(p_sets) s
  join public.routine_exercises re on re.routine_id = r.id and re.position = (s ->> 0)::smallint;
  return new_id;
end;
$$;

-- Inserts one GPS run. p_splits = [{ "km": 1, "seconds": 330 }, …] (last one may be partial).
create or replace function seed.logging_run(
  p_start timestamp, p_seconds integer, p_meters integer, p_hr integer, p_splits jsonb, p_notes text default ''
)
returns uuid
language sql
as $$
  insert into public.activities (owner_id, kind, started_at, duration_seconds, distance_m, gps, splits, avg_heart_rate, notes)
  values (seed.demo_user(), 'run', p_start at time zone 'America/Sao_Paulo', p_seconds, p_meters, true, p_splits, p_hr, p_notes)
  returning id;
$$;

create or replace function seed.demo_30_sessions() returns void language plpgsql as $$
begin
  perform seed.logging_session('A', '2026-10-19 18:41', 61, '[[0,0,60,8],[0,1,60,8],[0,2,60,7],[0,3,57.5,8],[1,0,22,10],[1,1,22,10],[1,2,22,10],[2,0,35,12],[2,1,35,12],[2,2,35,11],[3,0,25,12],[3,1,25,12],[3,2,25,10],[4,0,null,10],[4,1,null,9],[4,2,null,8]]');
  perform seed.logging_session('A', '2026-10-12 18:48', 48, '[[0,0,60,8],[0,1,60,8],[0,2,60,7],[0,3,57.5,8],[1,0,22.5,10],[1,1,22.5,10],[1,2,22.5,10],[2,0,35,12],[2,1,35,12],[2,2,35,11],[3,0,25,12],[3,1,25,12],[3,2,25,10],[4,0,null,9],[4,1,null,8],[4,2,null,7]]');
  perform seed.logging_session('A', '2026-10-05 18:55', 55, '[[0,0,57.5,8],[0,1,57.5,8],[0,2,57.5,7],[0,3,55,8],[1,0,22.5,10],[1,1,22.5,10],[1,2,22.5,10],[2,0,35,12],[2,1,35,12],[2,2,35,11],[3,0,25,12],[3,1,25,12],[3,2,25,10],[4,0,null,8],[4,1,null,7],[4,2,null,6]]');
  perform seed.logging_session('A', '2026-09-28 18:32', 52, '[[0,0,57.5,8],[0,1,57.5,8],[0,2,57.5,7],[0,3,55,8],[1,0,20,10],[1,1,20,10],[1,2,20,10],[2,0,32.5,12],[2,1,32.5,12],[2,2,32.5,11],[3,0,25,12],[3,1,25,12],[3,2,25,10],[4,0,null,7],[4,1,null,6],[4,2,null,5]]');
  perform seed.logging_session('A', '2026-09-21 18:39', 53, '[[0,0,55,8],[0,1,55,8],[0,2,55,7],[0,3,52.5,8],[1,0,20,10],[1,1,20,10],[1,2,20,10],[2,0,32.5,12],[2,1,32.5,12],[2,2,32.5,11],[3,0,22.5,12],[3,1,22.5,12],[3,2,22.5,10],[4,0,null,6],[4,1,null,5],[4,2,null,4]]');
  perform seed.logging_session('A', '2026-09-14 18:46', 60, '[[0,0,52.5,8],[0,1,52.5,8],[0,2,52.5,7],[0,3,50,8],[1,0,20,10],[1,1,20,10],[1,2,20,10],[2,0,32.5,12],[2,1,32.5,12],[2,2,32.5,11],[3,0,22.5,12],[3,1,22.5,12],[3,2,22.5,10],[4,0,null,5],[4,1,null,4],[4,2,null,3]]');
  perform seed.logging_session('A', '2026-09-07 18:53', 61, '[[0,0,52.5,8],[0,1,52.5,8],[0,2,52.5,7],[0,3,50,8],[1,0,20,10],[1,1,20,10],[1,2,20,10],[2,0,30,12],[2,1,30,12],[2,2,30,11],[3,0,22.5,12],[3,1,22.5,12],[3,2,22.5,10],[4,0,null,4],[4,1,null,3],[4,2,null,2]]');
  perform seed.logging_session('A', '2026-08-31 18:29', 61, '[[0,0,50,8],[0,1,50,8],[0,2,50,7],[0,3,47.5,8],[1,0,17.5,10],[1,1,17.5,10],[1,2,17.5,10],[2,0,27.5,12],[2,1,27.5,12],[2,2,27.5,11],[3,0,20,12],[3,1,20,12],[3,2,20,10],[4,0,null,3],[4,1,null,2],[4,2,null,1]]');
  perform seed.logging_session('B', '2026-10-21 18:39', 53, '[[0,0,55,10],[0,1,55,10],[0,2,55,9],[0,3,50,10],[1,0,50,8],[1,1,50,8],[1,2,50,7],[1,3,50,7],[2,0,45,12],[2,1,45,12],[2,2,45,11],[3,0,14,10],[3,1,14,10],[3,2,14,8]]');
  perform seed.logging_session('B', '2026-10-14 18:46', 60, '[[0,0,55,10],[0,1,55,10],[0,2,55,9],[0,3,50,10],[1,0,50,8],[1,1,50,8],[1,2,50,7],[1,3,50,7],[2,0,45,12],[2,1,45,12],[2,2,45,11],[3,0,15,10],[3,1,15,10],[3,2,15,8]]');
  perform seed.logging_session('B', '2026-10-07 18:53', 61, '[[0,0,52.5,10],[0,1,52.5,10],[0,2,52.5,9],[0,3,47.5,10],[1,0,50,8],[1,1,50,8],[1,2,50,7],[1,3,50,7],[2,0,45,12],[2,1,45,12],[2,2,45,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('B', '2026-09-30 18:30', 58, '[[0,0,52.5,10],[0,1,52.5,10],[0,2,52.5,9],[0,3,47.5,10],[1,0,47.5,8],[1,1,47.5,8],[1,2,47.5,7],[1,3,47.5,7],[2,0,42.5,12],[2,1,42.5,12],[2,2,42.5,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('B', '2026-09-23 18:37', 59, '[[0,0,50,10],[0,1,50,10],[0,2,50,9],[0,3,45,10],[1,0,47.5,8],[1,1,47.5,8],[1,2,47.5,7],[1,3,47.5,7],[2,0,42.5,12],[2,1,42.5,12],[2,2,42.5,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('B', '2026-09-16 18:44', 52, '[[0,0,50,10],[0,1,50,10],[0,2,50,9],[0,3,45,10],[1,0,45,8],[1,1,45,8],[1,2,45,7],[1,3,45,7],[2,0,40,12],[2,1,40,12],[2,2,40,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('B', '2026-09-09 18:51', 53, '[[0,0,47.5,10],[0,1,47.5,10],[0,2,47.5,9],[0,3,42.5,10],[1,0,42.5,8],[1,1,42.5,8],[1,2,42.5,7],[1,3,42.5,7],[2,0,37.5,12],[2,1,37.5,12],[2,2,37.5,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('B', '2026-09-02 18:58', 60, '[[0,0,45,10],[0,1,45,10],[0,2,45,9],[0,3,40,10],[1,0,40,8],[1,1,40,8],[1,2,40,7],[1,3,40,7],[2,0,37.5,12],[2,1,37.5,12],[2,2,37.5,11],[3,0,12.5,10],[3,1,12.5,10],[3,2,12.5,8]]');
  perform seed.logging_session('C', '2026-10-23 18:37', 59, '[[0,0,80,6],[0,1,80,6],[0,2,80,6],[0,3,75,6],[1,0,160,10],[1,1,160,10],[1,2,160,9],[1,3,150,10],[2,0,45,12],[2,1,45,12],[2,2,45,10],[3,0,50,10],[3,1,50,10],[3,2,50,9],[4,0,60,15],[4,1,60,15],[4,2,60,14],[4,3,60,12]]');
  perform seed.logging_session('C', '2026-10-16 18:44', 52, '[[0,0,80,6],[0,1,80,6],[0,2,80,6],[0,3,75,6],[1,0,157.5,10],[1,1,157.5,10],[1,2,157.5,9],[1,3,147.5,10],[2,0,45,12],[2,1,45,12],[2,2,45,10],[3,0,50,10],[3,1,50,10],[3,2,50,9],[4,0,60,15],[4,1,60,15],[4,2,60,14],[4,3,60,12]]');
  perform seed.logging_session('C', '2026-09-25 18:35', 57, '[[0,0,77.5,6],[0,1,77.5,6],[0,2,77.5,6],[0,3,72.5,6],[1,0,155,10],[1,1,155,10],[1,2,155,9],[1,3,145,10],[2,0,45,12],[2,1,45,12],[2,2,45,10],[3,0,50,10],[3,1,50,10],[3,2,50,9],[4,0,57.5,15],[4,1,57.5,15],[4,2,57.5,14],[4,3,57.5,12]]');
  perform seed.logging_session('C', '2026-09-18 18:42', 58, '[[0,0,77.5,6],[0,1,77.5,6],[0,2,77.5,6],[0,3,72.5,6],[1,0,152.5,10],[1,1,152.5,10],[1,2,152.5,9],[1,3,142.5,10],[2,0,42.5,12],[2,1,42.5,12],[2,2,42.5,10],[3,0,47.5,10],[3,1,47.5,10],[3,2,47.5,9],[4,0,57.5,15],[4,1,57.5,15],[4,2,57.5,14],[4,3,57.5,12]]');
  perform seed.logging_session('C', '2026-09-11 18:49', 59, '[[0,0,75,6],[0,1,75,6],[0,2,75,6],[0,3,70,6],[1,0,147.5,10],[1,1,147.5,10],[1,2,147.5,9],[1,3,137.5,10],[2,0,42.5,12],[2,1,42.5,12],[2,2,42.5,10],[3,0,47.5,10],[3,1,47.5,10],[3,2,47.5,9],[4,0,55,15],[4,1,55,15],[4,2,55,14],[4,3,55,12]]');
  perform seed.logging_session('C', '2026-09-04 18:56', 52, '[[0,0,72.5,6],[0,1,72.5,6],[0,2,72.5,6],[0,3,67.5,6],[1,0,142.5,10],[1,1,142.5,10],[1,2,142.5,9],[1,3,132.5,10],[2,0,40,12],[2,1,40,12],[2,2,40,10],[3,0,45,10],[3,1,45,10],[3,2,45,9],[4,0,52.5,15],[4,1,52.5,15],[4,2,52.5,14],[4,3,52.5,12]]');
  perform seed.logging_session('C', '2026-08-28 18:32', 52, '[[0,0,67.5,6],[0,1,67.5,6],[0,2,67.5,6],[0,3,62.5,6],[1,0,137.5,10],[1,1,137.5,10],[1,2,137.5,9],[1,3,127.5,10],[2,0,37.5,12],[2,1,37.5,12],[2,2,37.5,10],[3,0,42.5,10],[3,1,42.5,10],[3,2,42.5,9],[4,0,52.5,15],[4,1,52.5,15],[4,2,52.5,14],[4,3,52.5,12]]');
  perform seed.logging_session('C', '2026-08-21 18:39', 53, '[[0,0,65,6],[0,1,65,6],[0,2,65,6],[0,3,60,6],[1,0,130,10],[1,1,130,10],[1,2,130,9],[1,3,120,10],[2,0,37.5,12],[2,1,37.5,12],[2,2,37.5,10],[3,0,40,10],[3,1,40,10],[3,2,40,9],[4,0,50,15],[4,1,50,15],[4,2,50,14],[4,3,50,12]]');
end;
$$;

create or replace function seed.demo_31_activities() returns void language plpgsql as $$
begin
  -- Record holders, outside the 12-week evolution window.
  perform seed.logging_run('2026-06-07 07:30', 3807, 10600, 150, '[{"km": 1, "seconds": 352}, {"km": 1, "seconds": 345}, {"km": 1, "seconds": 340}, {"km": 1, "seconds": 342}, {"km": 1, "seconds": 341}, {"km": 1, "seconds": 341}, {"km": 1, "seconds": 345}, {"km": 1, "seconds": 365}, {"km": 1, "seconds": 380}, {"km": 1, "seconds": 406}, {"km": 0.6, "seconds": 250}]');
  perform seed.logging_run('2026-07-12 07:15', 4417, 12400, 152, '[{"km": 1, "seconds": 360}, {"km": 1, "seconds": 365}, {"km": 1, "seconds": 286}, {"km": 1, "seconds": 330}, {"km": 1, "seconds": 345}, {"km": 1, "seconds": 350}, {"km": 1, "seconds": 350}, {"km": 1, "seconds": 368}, {"km": 1, "seconds": 368}, {"km": 1, "seconds": 370}, {"km": 1, "seconds": 380}, {"km": 1, "seconds": 385}, {"km": 0.4, "seconds": 160}]', 'Longão de domingo');
  -- Last 12 weeks.
  perform seed.logging_run('2026-09-29 07:21', 1780, 5200, 147, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}, {"km": 0.2, "seconds": 100}]');
  perform seed.logging_run('2026-10-06 07:04', 1625, 4800, 156, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 0.8, "seconds": 287}]');
  perform seed.logging_run('2026-10-10 07:10', 2550, 7500, 156, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}, {"km": 1, "seconds": 328}, {"km": 1, "seconds": 331}, {"km": 0.5, "seconds": 211}]');
  perform seed.logging_run('2026-10-13 07:17', 1690, 5000, 157, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}]');
  perform seed.logging_run('2026-10-17 07:23', 2642, 7800, 157, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}, {"km": 1, "seconds": 328}, {"km": 1, "seconds": 331}, {"km": 0.8, "seconds": 303}]');
  perform seed.logging_run('2026-10-20 07:20', 1700, 5100, 154, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}, {"km": 0.1, "seconds": 32}]');
  perform seed.logging_run('2026-10-24 07:26', 2741, 8200, 154, '[{"km": 1, "seconds": 330}, {"km": 1, "seconds": 333}, {"km": 1, "seconds": 336}, {"km": 1, "seconds": 339}, {"km": 1, "seconds": 342}, {"km": 1, "seconds": 328}, {"km": 1, "seconds": 331}, {"km": 1, "seconds": 334}, {"km": 0.2, "seconds": 68}]');
end;
$$;

create or replace function seed.demo_32_body() returns void language plpgsql as $$
begin
  -- Scale weigh-ins synced from Apple Health.
  insert into public.body_measurements (owner_id, measured_on, weight_kg, source) values
  (seed.demo_user(), '2026-09-27', 79.8, 'health'),
  (seed.demo_user(), '2026-09-30', 79.5, 'health'),
  (seed.demo_user(), '2026-10-04', 79.5, 'health'),
  (seed.demo_user(), '2026-10-07', 79.0, 'health'),
  (seed.demo_user(), '2026-10-11', 79.1, 'health'),
  (seed.demo_user(), '2026-10-14', 78.5, 'health'),
  (seed.demo_user(), '2026-10-18', 78.6, 'health'),
  (seed.demo_user(), '2026-10-21', 78.1, 'health'),
  (seed.demo_user(), '2026-10-25', 78.1, 'health');
  -- Tape measures logged by hand (no weight that day).
  insert into public.body_measurements (owner_id, measured_on, waist_cm, hip_cm, arm_cm, source) values
  (seed.demo_user(), '2026-10-05', 86, 98, 35.5, 'manual');
end;
$$;
