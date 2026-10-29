-- Account (Perfil): history deletion through RLS, account deletion and read-only subscriptions.
begin;
select plan(15);

select tests.create_user('ana_acc') as ana \gset
select tests.create_user('bob_acc') as bob \gset

-- Arrange: one session (with a set) and one run each.
insert into public.workout_sessions (id, owner_id, title, started_at, ended_at) values
  ('10000000-0000-4000-8000-0000000000a1', :'ana', 'Treino A', '2026-10-20 10:00Z', '2026-10-20 11:00Z'),
  ('10000000-0000-4000-8000-0000000000b1', :'bob', 'Treino B', '2026-10-20 10:00Z', '2026-10-20 11:00Z');
insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps) values
  ('10000000-0000-4000-8000-0000000000a1', seed.lib('supino-reto-com-barra'), 0, 0, 60, 8),
  ('10000000-0000-4000-8000-0000000000b1', seed.lib('supino-reto-com-barra'), 0, 0, 60, 8);
insert into public.activities (owner_id, kind, started_at, duration_seconds, distance_m) values
  (:'ana', 'run', '2026-10-21 07:00Z', 1800, 5000),
  (:'bob', 'run', '2026-10-21 07:00Z', 1800, 5000);
insert into public.subscriptions (user_id, plan, status) values (:'ana', 'year', 'trialing');

-- A stranger cannot delete someone else's history (RLS filters the rows out).
select tests.authenticate_as(:'bob');
delete from public.workout_sessions where owner_id = :'ana';
delete from public.activities where owner_id = :'ana';
select tests.clear_authentication();
select is((select count(*)::int from public.workout_sessions where owner_id = :'ana'), 1, 'stranger cannot delete sessions');
select is((select count(*)::int from public.activities where owner_id = :'ana'), 1, 'stranger cannot delete activities');

-- The owner deletes her history: sessions (sets cascade) and activities.
select tests.authenticate_as(:'ana');
select is((select count(*)::int from public.workout_sessions), 1, 'owner sees only her sessions');
delete from public.workout_sessions where owner_id = :'ana';
delete from public.activities where owner_id = :'ana';
select tests.clear_authentication();
select is((select count(*)::int from public.workout_sessions where owner_id = :'ana'), 0, 'owner deletes her sessions');
select is((select count(*)::int from public.session_sets where session_id = '10000000-0000-4000-8000-0000000000a1'), 0, 'sets cascade with the session');
select is((select count(*)::int from public.activities where owner_id = :'ana'), 0, 'owner deletes her activities');
select is((select count(*)::int from public.workout_sessions where owner_id = :'bob'), 1, 'other users keep their sessions');
select is((select count(*)::int from public.goals where user_id = :'ana'), 1, 'goals survive a history deletion');

-- Subscriptions are read-only for clients.
select tests.authenticate_as(:'ana');
select is((select status::text from public.subscriptions), 'trialing', 'owner reads her subscription');
select throws_ok(
  format('update public.subscriptions set status = %L where user_id = %L', 'active', :'ana'),
  '42501', null, 'clients cannot change their subscription'
);
select throws_ok(
  format('insert into public.subscriptions (user_id, plan, status) values (%L, %L, %L)', :'ana', 'month', 'active'),
  '42501', null, 'clients cannot grant themselves a subscription'
);
select tests.clear_authentication();

-- delete_account: anonymous callers are refused, the owner removes everything she owns.
select tests.authenticate_as_anon();
select throws_ok('select public.delete_account()', '42501', null, 'anon cannot delete accounts');
select tests.clear_authentication();
select tests.authenticate_as(:'bob');
select lives_ok('select public.delete_account()', 'a user deletes her own account');
select tests.clear_authentication();
select is((select count(*)::int from auth.users where id = :'bob'), 0, 'auth user removed');
select is(
  (select count(*)::int from public.workout_sessions where owner_id = :'bob')
  + (select count(*)::int from public.profiles where id = :'bob')
  + (select count(*)::int from public.user_settings where user_id = :'bob'),
  0, 'owned rows cascade'
);

select * from finish();
rollback;
