-- Achievements, monthly recap and weekly summary (20261030400000_achievements.sql):
-- badge rules and their boundaries, local-day cut, "today" from the client, records,
-- the empty user, other users' data never counted and anon refused.
begin;
select plan(48);

select has_function('public', 'achievements', array['date'], 'achievements(date) exists');
select has_function('public', 'monthly_recap', array['date'], 'monthly_recap(date) exists');
select has_function('public', 'weekly_summary', array['date'], 'weekly_summary(date) exists');

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select id as bench from public.exercises where owner_id is null and slug = 'supino-reto-com-barra' \gset
-- Weekly goal of 1 workout makes the perfect-month rule easy to arrange.
update public.goals set workouts_per_week = 1 where user_id = :'alice';

-- ---------------------------------------------------------------------------
-- Empty user
-- ---------------------------------------------------------------------------
select tests.authenticate_as(:'alice');
select is((select count(*)::int from public.achievements('2026-03-12')), 8, 'eight badges');
select results_eq(
  $$ select id from public.achievements('2026-03-12') $$,
  $$ values ('streak12'), ('workouts50'), ('first5k'), ('oneTon'), ('perfectMonth'), ('tenKSub55'), ('streak30'), ('workouts100') $$,
  'badges come in catalog order'
);
select is((select count(*)::int from public.achievements('2026-03-12') where earned_on is null and progress = 0), 8, 'empty user: nothing earned, no progress');
select is((public.weekly_summary('2026-03-09') ->> 'workouts')::int, 0, 'empty user: no workouts in the week');
select is((select count(*)::int from jsonb_array_elements(public.weekly_summary('2026-03-09') -> 'days') d where d ->> 'kind' = 'rest'), 7, 'empty user: seven rest days');
select is(public.monthly_recap('2026-03-12') -> 'records', '[]'::jsonb, 'empty user: no records');
select ok(public.monthly_recap('2026-03-12') -> 'favoriteWeekday' = 'null'::jsonb, 'empty user: no favorite weekday');
select is(public.current_streak('2026-03-12'), 0, 'empty user: no streak');
select throws_ok($$ select public.weekly_summary('2026-03-10') $$, '22023', null, 'the week starts on a Monday');

-- ---------------------------------------------------------------------------
-- Arrange Alice's history (as Alice; RLS applies)
-- ---------------------------------------------------------------------------
-- Feb: one walk per week (Mondays) → perfect month with a goal of 1.
insert into public.activities (kind, started_at, duration_seconds, distance_m)
select 'walk', (d + time '07:00') at time zone 'America/Sao_Paulo', 1800, 2500
from generate_series(date '2026-02-02', date '2026-02-23', interval '7 days') d;
-- Mar 1–11 walks plus Mar 12 at 22:00 in São Paulo (already Mar 13 in UTC): 12 days in a row.
insert into public.activities (kind, started_at, duration_seconds, distance_m)
select 'walk', (d + time '07:00') at time zone 'America/Sao_Paulo', 1800, 2500
from generate_series(date '2026-03-01', date '2026-03-11', interval '1 day') d;
insert into public.activities (kind, started_at, duration_seconds, distance_m)
values ('walk', '2026-03-13 01:00Z', 1800, 2500);
-- Strength: 999 kg on Mar 2 (first time, not a record), 1 000 kg on Mar 9 (record + one ton).
select public.save_workout_session(jsonb_build_object(
  'title', 'Treino A', 'focus', 'Peito', 'startedAt', '2026-03-02 18:00-03', 'endedAt', '2026-03-02 19:00-03',
  'sets', jsonb_build_array(jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 99.9, 'reps', 10))));
select public.save_workout_session(jsonb_build_object(
  'title', 'Treino A', 'focus', 'Peito', 'startedAt', '2026-03-09 18:00-03', 'endedAt', '2026-03-09 19:00-03',
  'sets', jsonb_build_array(
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 40, 'reps', 8, 'isWarmup', true),
    jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 1, 'kg', 100, 'reps', 10))));
-- Runs: 4 999 m, 5 000 m, 10 km in exactly 55:00, and 10 km under 55:00 inside a 10,4 km run.
insert into public.activities (kind, started_at, duration_seconds, distance_m, gps, splits) values
('run', '2026-03-03 07:30-03', 1700, 4999, true, '[{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":0.999,"seconds":340}]'),
('run', '2026-03-04 07:30-03', 1700, 5000, true, '[{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":1,"seconds":340},{"km":1,"seconds":340}]'),
('run', '2026-03-05 07:30-03', 3300, 10000, true, (select jsonb_agg(jsonb_build_object('km', 1, 'seconds', 330)) from generate_series(1, 10))),
('run', '2026-03-10 07:30-03', 3690, 10400, true, '[{"km":1,"seconds":400}]'::jsonb || (select jsonb_agg(jsonb_build_object('km', 1, 'seconds', 329)) from generate_series(1, 10)));

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
select is((select earned_on from public.achievements('2026-03-12') where id = 'streak12'), '2026-03-12'::date, 'streak12 earned on the 12th day (local day, not UTC)');
select is((select earned_on from public.achievements('2026-03-11') where id = 'streak12'), null::date, 'entries after p_today are ignored');
select is((select progress from public.achievements('2026-03-11') where id = 'streak12'), 0.916, 'streak12 progress = longest streak / 12');
select is((select progress from public.achievements('2026-03-12') where id = 'streak30'), 0.400, 'streak30 progress = 12 / 30');
select is((select current from public.achievements('2026-03-12') where id = 'streak30'), 12::numeric, 'streak30 current = longest streak');
select is((select current from public.achievements('2026-03-12') where id = 'workouts50'), 22::numeric, 'workouts count sessions and activities');
select is((select progress from public.achievements('2026-03-12') where id = 'workouts100'), 0.220, 'workouts100 progress = 22 / 100');
select is((select earned_on from public.achievements('2026-03-12') where id = 'first5k'), '2026-03-04'::date, 'first5k needs 5 000 m (4 999 m does not count)');
select is((select earned_on from public.achievements('2026-03-03') where id = 'first5k'), null::date, 'first5k locked before the 5 km run');
select is((select progress from public.achievements('2026-03-03') where id = 'first5k'), 0.999, 'first5k progress = longest run / 5 000 (truncated, never full while locked)');
select is((select earned_on from public.achievements('2026-03-12') where id = 'oneTon'), '2026-03-09'::date, 'oneTon needs 1 000 kg (999 kg does not count; warm-ups ignored)');
select is((select progress from public.achievements('2026-03-08') where id = 'oneTon'), 0.999, 'oneTon progress = best session volume / 1 000');
select is((select earned_on from public.achievements('2026-03-12') where id = 'tenKSub55'), '2026-03-10'::date, 'tenKSub55 needs < 55:00, also inside a longer run');
select is((select current from public.achievements('2026-03-09') where id = 'tenKSub55'), 3300::numeric, 'exactly 55:00 is not under 55:00');
select is((select earned_on from public.achievements('2026-03-12') where id = 'perfectMonth'), '2026-02-23'::date, 'perfectMonth: every week of February reached the goal');
select is((select earned_on from public.achievements('2026-02-22') where id = 'perfectMonth'), null::date, 'perfectMonth locked until the last week reaches the goal');
select is((select progress from public.achievements('2026-02-22') where id = 'perfectMonth'), 0.750, 'perfectMonth progress = weeks reached / weeks of the month');

-- ---------------------------------------------------------------------------
-- Streak, recap and weekly summary
-- ---------------------------------------------------------------------------
select is(public.current_streak('2026-03-12'), 12, 'current streak ending today');
select is(public.current_streak('2026-03-13'), 12, 'today not over yet: the streak still counts');
select is(public.current_streak('2026-03-14'), 0, 'a full day without activity breaks the streak');

select is((public.monthly_recap('2026-03-12') ->> 'workouts')::int, 18, 'recap: month-to-date entries');
select is((public.monthly_recap('2026-03-12') ->> 'previousWorkouts')::int, 4, 'recap: whole previous month');
select is((public.monthly_recap('2026-03-12') ->> 'best5kSeconds')::numeric, 1645::numeric, 'recap: best 5 consecutive km of the month');
select is(jsonb_array_length(public.monthly_recap('2026-03-12') -> 'records'), 1, 'recap: the first session of an exercise is not a record');
select is((public.monthly_recap('2026-03-12') -> 'records' -> 0 ->> 'previousKg')::numeric, 99.90, 'recap: record keeps the previous best');

select is((public.weekly_summary('2026-03-09') ->> 'workouts')::int, 6, 'week: entries Monday–Sunday');
select is((public.weekly_summary('2026-03-09') -> 'previous' ->> 'workouts')::int, 11, 'week: previous week');
select is((public.weekly_summary('2026-03-09') ->> 'volumeKg')::numeric, 1000::numeric, 'week: working-set volume');
select results_eq(
  $$ select d ->> 'kind' from jsonb_array_elements(public.weekly_summary('2026-03-09') -> 'days') d $$,
  $$ values ('strength'), ('run'), ('other'), ('other'), ('rest'), ('rest'), ('rest') $$,
  'week: per-day kind (strength > run > other > rest)'
);
select is((public.weekly_summary('2026-03-09') -> 'records' -> 0 ->> 'kg')::numeric, 100::numeric, 'week: new record');
select is((public.weekly_summary('2026-03-09') -> 'longestRun' ->> 'longestOfMonth')::boolean, true, 'week: longest run of the month');

-- ---------------------------------------------------------------------------
-- Isolation
-- ---------------------------------------------------------------------------
select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.achievements('2026-03-12') where earned_on is null and progress = 0), 8, 'Bob never sees Alice''s badges');
select is((public.weekly_summary('2026-03-09') ->> 'workouts')::int, 0, 'Alice''s week is not counted for Bob');
select is((public.monthly_recap('2026-03-12') ->> 'workouts')::int, 0, 'Alice''s month is not counted for Bob');
select is(public.current_streak('2026-03-12'), 0, 'Alice''s streak is not counted for Bob');

select tests.authenticate_as_anon();
select throws_ok($$ select * from public.achievements('2026-03-12') $$, '42501', null, 'anon cannot read achievements');

select * from finish();
rollback;
