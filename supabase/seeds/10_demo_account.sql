-- =============================================================================
-- Demo account used by the app in development and by the Maestro E2E suite.
--   e-mail: lucas@tracta.app · password: Tracta2026 · handle: @lucas
-- Friends ana/bruno/carla (accepted), diego/elisa (not friends yet, for invites).
-- Domain-specific demo data (history, social, inbox…) lives in the next seed files.
-- =============================================================================

select seed.create_user(seed.demo_user(), 'lucas@tracta.app', 'Tracta2026', 'Lucas Andrade', 'lucas');
select seed.create_user(seed.friend('ana'), 'ana@tracta.app', 'Tracta2026', 'Ana Souza', 'ana');
select seed.create_user(seed.friend('bruno'), 'bruno@tracta.app', 'Tracta2026', 'Bruno Lima', 'bruno');
select seed.create_user(seed.friend('carla'), 'carla@tracta.app', 'Tracta2026', 'Carla Dias', 'carla');
select seed.create_user(seed.friend('diego'), 'diego@tracta.app', 'Tracta2026', 'Diego Melo', 'diego');
select seed.create_user(seed.friend('elisa'), 'elisa@tracta.app', 'Tracta2026', 'Elisa Rocha', 'elisa');

-- Demo data is loaded by seed.demo_* functions (see 90_load_demo.sql), so the E2E reset can
-- replay exactly the same state. Each domain owns one loader in its own seed file.

create or replace function seed.demo_10_training_routines() returns void language plpgsql as $$
begin
  insert into public.routines (id, owner_id, label, name, focus, weekday, position) values (seed.demo_routine('A'), seed.demo_user(), 'A', 'Treino A', 'Peito & Tríceps', 0, 0);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('A'), seed.lib('supino-reto-com-barra'), 0, 4, 8, 60, 120, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('A'), seed.lib('supino-inclinado'), 1, 3, 10, 22, 90, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('A'), seed.lib('crucifixo-na-maquina'), 2, 3, 12, 35, 60, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('A'), seed.lib('triceps-na-corda'), 3, 3, 12, 25, 0, 'S1');
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('A'), seed.lib('mergulho-nas-paralelas'), 4, 3, 10, null, 90, 'S1');
  insert into public.routines (id, owner_id, label, name, focus, weekday, position) values (seed.demo_routine('B'), seed.demo_user(), 'B', 'Treino B', 'Costas & Bíceps', 2, 1);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('B'), seed.lib('puxada-frontal'), 0, 4, 10, 55, 90, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('B'), seed.lib('remada-curvada'), 1, 4, 8, 50, 120, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('B'), seed.lib('remada-baixa'), 2, 3, 12, 45, 60, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('B'), seed.lib('rosca-direta'), 3, 3, 10, 14, 60, null);
  insert into public.routines (id, owner_id, label, name, focus, weekday, position) values (seed.demo_routine('C'), seed.demo_user(), 'C', 'Treino C', 'Pernas', 4, 2);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('C'), seed.lib('agachamento-livre'), 0, 4, 6, 80, 150, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('C'), seed.lib('leg-press-45'), 1, 4, 10, 160, 120, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('C'), seed.lib('cadeira-extensora'), 2, 3, 12, 45, 60, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('C'), seed.lib('stiff'), 3, 3, 10, 50, 90, null);
  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset) values (seed.demo_routine('C'), seed.lib('panturrilha-em-pe'), 4, 4, 15, 60, 45, null);

end;
$$;

create or replace function seed.demo_11_social_graph() returns void language plpgsql as $$
begin
  -- Accepted friendships with ana/bruno/carla; diego and elisa stay strangers (invite flows).
  insert into public.friend_requests (from_id, to_id, status, responded_at) values
  (seed.demo_user(), seed.friend('ana'), 'accepted', now()),
  (seed.friend('bruno'), seed.demo_user(), 'accepted', now()),
  (seed.demo_user(), seed.friend('carla'), 'accepted', now());
end;
$$;
