-- Offline saves: replaying a client_id is idempotent, is scoped per user, and a routine deleted
-- while the workout waited on the device doesn't lose it.
begin;
select plan(9);

select has_column('public', 'workout_sessions', 'client_id', 'workout_sessions.client_id exists');
select has_column('public', 'activities', 'client_id', 'activities.client_id exists');

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select id as bench from public.exercises where owner_id is null and slug = 'supino-reto-com-barra' \gset

\set cid '''5f0c1d9e-7a35-4b10-9c41-0d6a4f2b1a11'''
\set missing_routine '''11111111-2222-4333-8444-555555555555'''

select tests.authenticate_as(:'alice');
select public.save_workout_session(jsonb_build_object(
  'clientId', :cid::text, 'title', 'Treino A', 'startedAt', '2026-10-19 18:41-03', 'endedAt', '2026-10-19 19:42-03',
  'sets', jsonb_build_array(jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 60, 'reps', 8))
)) as first_save \gset
select public.save_workout_session(jsonb_build_object(
  'clientId', :cid::text, 'title', 'Treino A', 'startedAt', '2026-10-19 18:41-03', 'endedAt', '2026-10-19 19:42-03',
  'sets', jsonb_build_array(jsonb_build_object('exerciseId', :'bench', 'exercisePosition', 0, 'setIndex', 0, 'kg', 60, 'reps', 8))
)) as second_save \gset

select is(:'second_save'::uuid, :'first_save'::uuid, 'replaying a clientId returns the saved session');
select is((select count(*)::int from public.workout_sessions where client_id = :cid::uuid), 1, 'the replay adds no session');
select is((select count(*)::int from public.session_sets where session_id = :'first_save'), 1, 'the replay adds no sets');

select public.save_workout_session(jsonb_build_object(
  'routineId', :missing_routine::text, 'title', 'Treino B', 'startedAt', '2026-10-20 18:41-03', 'endedAt', '2026-10-20 19:42-03',
  'sets', jsonb_build_array()
)) as orphan \gset
select is((select routine_id from public.workout_sessions where id = :'orphan'), null::uuid, 'a deleted routine does not lose the workout');

insert into public.activities (kind, started_at, duration_seconds, client_id)
values ('walk', '2026-10-21 08:00-03', 600, :cid::uuid);
select throws_ok(
  format($$insert into public.activities (kind, started_at, duration_seconds, client_id) values ('walk', now(), 600, %L)$$, :cid::text),
  '23505', null, 'an activity client_id is unique per user'
);

select tests.authenticate_as(:'bob');
select public.save_workout_session(jsonb_build_object(
  'clientId', :cid::text, 'title', 'Treino A', 'startedAt', '2026-10-19 18:41-03', 'endedAt', '2026-10-19 19:42-03',
  'sets', jsonb_build_array()
)) as bob_save \gset
select isnt(:'bob_save'::uuid, :'first_save'::uuid, 'the same clientId from another user is another session');
select lives_ok(
  format($$insert into public.activities (kind, started_at, duration_seconds, client_id) values ('walk', now(), 600, %L)$$, :cid::text),
  'client_id uniqueness is scoped per user'
);

select * from finish();
rollback;
