-- Logging: sessions/sets/activities/body RLS, save_workout_session + last_sets, derived views,
-- constraints, and the daily_summaries sync trigger (20261028200000_logging_history.sql).
begin;
select plan(41);

select has_table('public', 'workout_sessions', 'workout_sessions table exists');
select has_table('public', 'activities', 'activities table exists');
select has_view('public', 'history_entries', 'history_entries view exists');
select has_column('public', 'activities', 'avg_heart_rate', 'activities.avg_heart_rate exists');
select ok((select relrowsecurity from pg_class where oid = 'public.session_sets'::regclass), 'RLS on session_sets');
select ok((select relrowsecurity from pg_class where oid = 'public.body_measurements'::regclass), 'RLS on body_measurements');

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select id as bench from public.exercises where owner_id is null and slug = 'supino-reto-com-barra' \gset
select id as dip from public.exercises where owner_id is null and slug = 'mergulho-nas-paralelas' \gset

-- ---------------------------------------------------------------------------
-- save_workout_session (as Alice)
-- ---------------------------------------------------------------------------
select tests.authenticate_as(:'alice');
select public.save_workout_session(jsonb_build_object(
  'title', 'Treino A', 'focus', 'Peito', 'startedAt', '2026-10-19 18:41-03', 'endedAt', '2026-10-19 19:42-03',
  'sets', jsonb_build_array(
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 40, 'reps', 8, 'isWarmup', true),
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 60, 'reps', 8),
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 1, 'kg', 57.5, 'reps', 8),
    jsonb_build_object('exerciseId', :'dip', 'exercisePosition', 1, 'setIndex', 0, 'kg', null, 'reps', 10)
  ))) as s1 \gset

select is((select count(*)::int from public.session_sets where session_id = :'s1'), 4, 'session saved with its sets');
select is((select volume_kg from public.session_totals where session_id = :'s1'), 940.00::numeric(10, 2), 'volume ignores warm-up and bodyweight sets');
select is((select sets from public.session_totals where session_id = :'s1'), 3, 'set count ignores warm-up sets');
select is((select duration_seconds from public.session_totals where session_id = :'s1'), 3660, 'duration from start/end');

select public.save_workout_session(jsonb_build_object(
  'title', 'Treino A', 'startedAt', '2026-10-12 18:00-03', 'endedAt', '2026-10-12 19:00-03',
  'sets', jsonb_build_array(
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 62.5, 'reps', 5)
  ))) as s0 \gset

select results_eq(
  format('select kg, reps from public.last_sets(array[%L]::uuid[]) order by set_index', :'bench'),
  $$ values (60.00::numeric, 8::smallint), (57.50::numeric, 8::smallint) $$,
  'last_sets returns the working sets of the most recent session'
);
select is((select kg from public.personal_records where exercise_id = :'bench'), 62.50::numeric(6, 2), 'personal record is the heaviest working set');
select is((select session_id from public.personal_records where exercise_id = :'bench'), :'s0'::uuid, 'record points at its session');

select throws_ok(
  $$ select public.save_workout_session('{"title": "x", "startedAt": "2026-10-19 10:00Z", "endedAt": "2026-10-19 11:00Z"}') $$,
  '22023', null, 'sets must be an array'
);
select throws_ok(
  $$ select public.save_workout_session('{"title": "x", "startedAt": "2026-10-19 10:00Z", "endedAt": "2026-10-19 09:00Z", "sets": []}') $$,
  '23514', null, 'a session cannot end before it starts'
);

-- ---------------------------------------------------------------------------
-- Activities and body (as Alice)
-- ---------------------------------------------------------------------------
insert into public.activities (kind, started_at, duration_seconds, distance_m, gps, avg_heart_rate)
values ('run', '2026-10-19 07:00-03', 1700, 5100, true, 154) returning id as a1 \gset
select throws_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds) values ('yoga', now(), 0) $$,
  '23514', null, 'activity duration must be positive'
);
select throws_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds, avg_heart_rate) values ('run', now(), 60, 400) $$,
  '23514', null, 'average heart rate is range-checked'
);
insert into public.body_measurements (measured_on, weight_kg) values ('2026-10-26', 78.1);
select throws_ok(
  $$ insert into public.body_measurements (measured_on, weight_kg) values ('2026-10-26', 79) $$,
  '23505', null, 'one manual measurement per day'
);
select throws_ok(
  $$ insert into public.body_measurements (measured_on) values ('2026-10-27') $$,
  '23514', null, 'a measurement needs at least one value'
);
select is(
  (select array_agg(kind order by kind) from public.history_entries),
  array['run', 'strength', 'strength'],
  'history_entries lists sessions and activities'
);

-- ---------------------------------------------------------------------------
-- daily_summaries sync
-- ---------------------------------------------------------------------------
select tests.clear_authentication();
select is(
  (select workouts from public.daily_summaries where user_id = :'alice' and day = '2026-10-19'),
  2::smallint, 'a session and a run on the same day count two workouts'
);
select is(
  (select active_minutes from public.daily_summaries where user_id = :'alice' and day = '2026-10-19'),
  89, 'active minutes add up (61 + 28)'
);
select is(
  (select what from public.daily_summaries where user_id = :'alice' and day = '2026-10-19'),
  'Treino A · 61 min', 'what describes the longest entry of the day'
);
select is(
  (select what from public.daily_summaries where user_id = :'alice' and day = '2026-10-12'),
  'Treino A · 60 min', 'each day gets its own summary'
);

select tests.authenticate_as(:'alice');
delete from public.workout_sessions where id = :'s1';
select tests.clear_authentication();
select is(
  (select what from public.daily_summaries where user_id = :'alice' and day = '2026-10-19'),
  'Corrida · 5,1 km', 'deleting the session recomputes the day'
);

-- Steps (from Health) survive; an empty day without steps disappears.
update public.daily_summaries set steps = 7000 where user_id = :'alice' and day = '2026-10-19';
select tests.authenticate_as(:'alice');
delete from public.activities where id = :'a1';
delete from public.workout_sessions where id = :'s0';
select tests.clear_authentication();
select is(
  (select (workouts, active_minutes, steps, what)::text from public.daily_summaries where user_id = :'alice' and day = '2026-10-19'),
  '(0,0,7000,)', 'a day with steps keeps its row, zeroed'
);
select is(
  (select count(*)::int from public.daily_summaries where user_id = :'alice' and day = '2026-10-12'),
  0, 'an empty day without steps is removed'
);

-- Moving an activity to another day refreshes both days.
select tests.authenticate_as(:'alice');
insert into public.activities (kind, started_at, duration_seconds)
values ('yoga', '2026-10-20 08:00-03', 1800) returning id as a2 \gset
update public.activities set started_at = '2026-10-21 08:00-03' where id = :'a2';
select tests.clear_authentication();
select is(
  (select count(*)::int from public.daily_summaries where user_id = :'alice' and day = '2026-10-20'),
  0, 'the old day is cleared on update'
);
select is(
  (select what from public.daily_summaries where user_id = :'alice' and day = '2026-10-21'),
  'Yoga · 30 min', 'activities without distance show minutes'
);

-- ---------------------------------------------------------------------------
-- Isolation: Bob sees and changes nothing of Alice's.
-- ---------------------------------------------------------------------------
select tests.authenticate_as(:'alice');
select public.save_workout_session(jsonb_build_object(
  'title', 'Treino B', 'startedAt', '2026-10-21 18:00-03', 'endedAt', '2026-10-21 19:00-03', 'notes', 'ok',
  'sets', jsonb_build_array(jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 50, 'reps', 10))
)) as s2 \gset

select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.workout_sessions), 0, 'a stranger sees no sessions');
select is((select count(*)::int from public.session_sets), 0, 'a stranger sees no sets');
select is((select count(*)::int from public.activities), 0, 'a stranger sees no activities');
select is((select count(*)::int from public.body_measurements), 0, 'a stranger sees no body measurements');
select is((select count(*)::int from public.history_entries), 0, 'a stranger sees no history entries');
select is((select count(*)::int from public.last_sets(array[:'bench']::uuid[])), 0, 'last_sets only reads own sessions');
select throws_ok(
  format($$ insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps)
            values (%L, %L, 0, 1, 100, 1) $$, :'s2', :'bench'),
  '42501', null, 'a stranger cannot add sets to someone else''s session'
);
update public.workout_sessions set notes = 'hacked' where id = :'s2';
delete from public.workout_sessions where id = :'s2';
select tests.clear_authentication();
select is((select notes from public.workout_sessions where id = :'s2'), 'ok', 'a stranger cannot update or delete a session');

select tests.authenticate_as_anon();
select throws_ok('select * from public.history_entries', '42501', null, 'anon cannot read history_entries');

select tests.authenticate_as(:'alice');
select throws_ok(
  format($$ select public.refresh_daily_summary(%L, '2026-10-21') $$, :'alice'),
  '42501', null, 'clients cannot call refresh_daily_summary directly'
);

-- Deleting the account cascades through the trigger without errors.
select tests.clear_authentication();
select lives_ok(format('delete from auth.users where id = %L', :'alice'), 'account deletion cascades through the summary trigger');
select is((select count(*)::int from public.daily_summaries where user_id = :'alice'), 0, 'no summaries left behind');

select * from finish();
rollback;
