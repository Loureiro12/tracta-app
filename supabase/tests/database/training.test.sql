-- Training plan: library visibility, custom exercises, prefs, routines + save_routine,
-- programs catalog, enrollments and races (RLS isolation and constraints).
begin;
select plan(41);

-- Schema --------------------------------------------------------------------
select ok((select bool_and(relrowsecurity) from pg_class where oid in (
  'public.exercises'::regclass, 'public.exercise_prefs'::regclass, 'public.routines'::regclass,
  'public.routine_exercises'::regclass, 'public.programs'::regclass,
  'public.program_enrollments'::regclass, 'public.races'::regclass)), 'RLS on every training table');
select has_column('public', 'exercises', 'position', 'exercises.position exists');
select has_function('public', 'save_routine', array['jsonb'], 'save_routine(jsonb) exists');
select is(
  (select array_agg(slug order by position) from (select slug, position from public.exercises
     where owner_id is null order by position limit 3) s),
  array['supino-reto-com-barra', 'supino-inclinado', 'crucifixo-na-maquina'],
  'built-in library has a curated order'
);
select ok(
  not has_function_privilege('anon', 'public.save_routine(jsonb)', 'execute'),
  'anon cannot call save_routine'
);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select seed.lib('supino-reto-com-barra') as bench \gset
select seed.lib('supino-inclinado') as incline \gset
select seed.lib('mergulho-nas-paralelas') as dips \gset

-- Exercises -------------------------------------------------------------------
select tests.authenticate_as(:'alice');
select is((select count(*)::int from public.exercises), 31, 'a new user sees the 31 built-in exercises');
insert into public.exercises (owner_id, slug, name, muscle_group, equipment)
  values (:'alice', 'rosca-no-cabo', 'Rosca no cabo', 'Bíceps', 'Polia');
select id as alice_ex from public.exercises where slug = 'rosca-no-cabo' and owner_id = :'alice' \gset
select is((select count(*)::int from public.exercises), 32, 'own custom exercise is visible');
select throws_ok(
  format($$insert into public.exercises (owner_id, slug, name, muscle_group, equipment)
           values (%L, 'intruso', 'Intruso', 'Peito', 'Barra')$$, :'bob'),
  '42501', null, 'cannot create an exercise owned by someone else'
);
select throws_ok(
  $$insert into public.exercises (owner_id, slug, name, muscle_group, equipment)
    values (null, 'falso-builtin', 'Falso', 'Peito', 'Barra')$$,
  '42501', null, 'cannot add to the built-in library'
);
select throws_ok(
  format($$insert into public.exercises (owner_id, slug, name, muscle_group, equipment)
           values (%L, 'rosca-no-cabo', 'Rosca no cabo 2', 'Bíceps', 'Polia')$$, :'alice'),
  '23505', null, 'slug is unique per owner'
);
select throws_ok(
  format($$insert into public.exercises (owner_id, slug, name, muscle_group, equipment)
           values (%L, 'Bad Slug', 'Bad', 'Peito', 'Barra')$$, :'alice'),
  '23514', null, 'slug format is checked'
);
update public.exercises set name = 'Hacked' where id = :'bench';
select tests.clear_authentication();
select is((select name from public.exercises where id = :'bench'), 'Supino reto com barra',
  'built-in exercises cannot be edited by users');

select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.exercises where id = :'alice_ex'), 0,
  'custom exercises are private');
update public.exercises set name = 'Bob was here' where id = :'alice_ex';
delete from public.exercises where id = :'alice_ex';
select tests.clear_authentication();
select is((select name from public.exercises where id = :'alice_ex'), 'Rosca no cabo',
  'a stranger cannot edit or delete a custom exercise');

-- Prefs ----------------------------------------------------------------------
select tests.authenticate_as(:'alice');
insert into public.exercise_prefs (user_id, exercise_id, favorite, notes) values (:'alice', :'bench', true, 'Banco 30');
select throws_ok(
  format($$insert into public.exercise_prefs (user_id, exercise_id, favorite) values (%L, %L, true)$$, :'bob', :'bench'),
  '42501', null, 'cannot write prefs for someone else'
);
select throws_ok(
  format($$update public.exercise_prefs set notes = repeat('x', 501) where exercise_id = %L$$, :'bench'),
  '23514', null, 'notes are limited to 500 characters'
);
select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.exercise_prefs), 0, 'prefs are private');

-- save_routine ----------------------------------------------------------------
select tests.authenticate_as(:'alice');
select public.save_routine(jsonb_build_object(
  'name', 'Treino A', 'focus', 'Peito', 'weekday', 0,
  'exercises', jsonb_build_array(
    jsonb_build_object('exerciseId', :'bench', 'sets', 4, 'reps', 8, 'kg', 60, 'restSeconds', 120),
    jsonb_build_object('exerciseId', :'incline', 'sets', 3, 'reps', 10, 'kg', 22, 'superset', 'S1'),
    jsonb_build_object('exerciseId', :'alice_ex', 'sets', 3, 'reps', 12, 'superset', 'S1')
  ))) as ra \gset
select is((select label from public.routines where id = :'ra'), 'A', 'first routine gets label A');
select is((select position from public.routines where id = :'ra'), 0::smallint, 'first routine at position 0');
select is((select array_agg(exercise_id order by position) from public.routine_exercises where routine_id = :'ra'),
  array[:'bench', :'incline', :'alice_ex']::uuid[], 'exercises saved in payload order');
select is((select rest_seconds from public.routine_exercises where routine_id = :'ra' and position = 1),
  90::smallint, 'rest defaults to 90 s');

select public.save_routine(jsonb_build_object('name', 'Treino B',
  'exercises', jsonb_build_array(jsonb_build_object('exerciseId', :'dips', 'sets', 3, 'reps', 10)))) as rb \gset
select is((select label || position from public.routines where id = :'rb'), 'B1', 'next routine gets B at position 1');

-- A used custom exercise cannot be deleted.
select throws_ok(
  format($$delete from public.exercises where id = %L$$, :'alice_ex'),
  '23503', null, 'cannot delete a custom exercise still used by a routine'
);

-- Update: reorder and shrink, same id, labels kept.
select is(public.save_routine(jsonb_build_object('id', :'ra', 'name', 'Push day', 'weekday', null,
  'exercises', jsonb_build_array(
    jsonb_build_object('exerciseId', :'incline', 'sets', 5, 'reps', 8),
    jsonb_build_object('exerciseId', :'bench', 'sets', 3, 'reps', 6, 'kg', 70)
  ))), :'ra'::uuid, 'update returns the same id');
select is((select name || coalesce(weekday::text, '-') || label from public.routines where id = :'ra'), 'Push day-A',
  'routine fields updated, label kept');
select is((select array_agg(exercise_id order by position) from public.routine_exercises where routine_id = :'ra'),
  array[:'incline', :'bench']::uuid[], 'exercises replaced and reordered');

select throws_ok(
  format($$select public.save_routine(jsonb_build_object('name', 'Empty', 'exercises', '[]'::jsonb))$$),
  '22023', null, 'a routine needs at least one exercise'
);
select throws_ok(
  format($$select public.save_routine(jsonb_build_object('name', 'X', 'exercises',
    jsonb_build_array(jsonb_build_object('exerciseId', %L, 'sets', 0, 'reps', 10))))$$, :'bench'),
  '23514', null, 'sets are range-checked'
);
-- A failing update leaves the previous version in place (atomic).
select throws_ok(
  format($$select public.save_routine(jsonb_build_object('id', %L, 'name', 'Broken', 'exercises',
    jsonb_build_array(jsonb_build_object('exerciseId', %L, 'sets', 3, 'reps', 999))))$$, :'ra', :'bench'),
  '23514', null, 'invalid exercise rejects the whole save'
);
select is((select count(*)::int from public.routine_exercises where routine_id = :'ra'), 2,
  'previous exercises survive a failed save');


-- Bob: isolation.
select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.routines), 0, 'routines are private');
select is((select count(*)::int from public.routine_exercises), 0, 'routine exercises are private');
select throws_ok(
  format($$select public.save_routine(jsonb_build_object('id', %L, 'name', 'Hijack', 'exercises',
    jsonb_build_array(jsonb_build_object('exerciseId', %L, 'sets', 3, 'reps', 10))))$$, :'ra', :'bench'),
  'P0002', null, 'cannot update someone else''s routine'
);
select throws_ok(
  format($$select public.save_routine(jsonb_build_object('name', 'Borrow', 'exercises',
    jsonb_build_array(jsonb_build_object('exerciseId', %L, 'sets', 3, 'reps', 10))))$$, :'alice_ex'),
  '42501', null, 'cannot use someone else''s custom exercise'
);
select throws_ok(
  format($$insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps)
           values (%L, %L, 9, 3, 10)$$, :'ra', :'bench'),
  '42501', null, 'cannot add exercises to someone else''s routine'
);
select is(public.save_routine(jsonb_build_object('name', 'Bob A',
  'exercises', jsonb_build_array(jsonb_build_object('exerciseId', :'bench', 'sets', 3, 'reps', 10))))
  is not null, true, 'labels are per user (Bob also starts at A)');
select is((select label from public.routines), 'A', 'Bob''s first routine is A');

-- Programs, enrollments, races -------------------------------------------------
select is((select count(*)::int from public.programs), 3, 'program catalog is readable');
select throws_ok(
  $$insert into public.programs (id, name, weeks, tag, frequency, description, pattern, legend, week_titles)
    values ('x', 'x', 1, 'x', 'x', 'x', array['—','—','—','—','—','—','—'], 'x', array['x'])$$,
  '42501', null, 'program catalog is read-only'
);
insert into public.program_enrollments (program_id) values ('forca');
insert into public.races (distance_m, race_date, target_seconds) values (10000, '2026-12-07', 3300);
select tests.authenticate_as(:'alice');
select is((select count(*)::int from public.program_enrollments) + (select count(*)::int from public.races), 0,
  'enrollments and races are private');
select throws_ok(
  $$insert into public.races (distance_m, race_date, target_seconds) values (500, '2026-12-07', 3300)$$,
  '23514', null, 'race distance is range-checked'
);

select * from finish();
rollback;
