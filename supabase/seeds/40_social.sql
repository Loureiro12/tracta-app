-- =============================================================================
-- Social + inbox demo data (the E2E clock freezes "today" at 2026-10-26).
--   c1 "Semana em movimento": ana's 7-day challenge with the demo user, bruno and carla.
--   Today: ana trained 52 min, carla 34 min, bruno not yet; the demo user not yet (6 842 steps).
--   diego/elisa are friends of ana/carla, so they show up as invite contacts for the demo user.
--   felipe (@felipe) invited the demo user and waits for an answer (accept/decline flows).
-- Deterministic ids: challenge c1 → 00000000-0000-4000-c000-000000000001,
-- inbox n1..n6 → 00000000-0000-4000-b000-00000000000N.
-- =============================================================================

-- Extra demo person for the received-invite flows (e-mail @tracta.app, so reset_demo restores it).
select seed.create_user('00000000-0000-4000-8000-000000000007', 'felipe@tracta.app', 'Tracta2026', 'Felipe Costa', 'felipe')
where not exists (select 1 from auth.users where id = '00000000-0000-4000-8000-000000000007');

create or replace function seed.demo_challenge(p_n integer) returns uuid language sql immutable as
$$ select ('00000000-0000-4000-c000-' || lpad(p_n::text, 12, '0'))::uuid $$;

create or replace function seed.demo_notification(p_n integer) returns uuid language sql immutable as
$$ select ('00000000-0000-4000-b000-' || lpad(p_n::text, 12, '0'))::uuid $$;

create or replace function seed.demo_40_social() returns void language plpgsql as $$
declare
  ana uuid := seed.friend('ana');
  bruno uuid := seed.friend('bruno');
  carla uuid := seed.friend('carla');
begin
  -- Friends of friends (invite contacts): ana ↔ diego, carla ↔ elisa.
  insert into public.friend_requests (from_id, to_id, status, responded_at) values
  (ana, seed.friend('diego'), 'accepted', now()),
  (seed.friend('elisa'), carla, 'accepted', now())
  on conflict do nothing;
  -- A pending invite the demo user received.
  insert into public.friend_requests (from_id, to_id) values
  ('00000000-0000-4000-8000-000000000007', seed.demo_user());

  -- Daily summaries. ana: 4-day streak ending today; carla: 9-day streak; bruno: nothing yet.
  insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what, updated_at)
  select ana, d::date, 45, 9500, 1, 'Treino de costas', (d::date + time '18:40') at time zone 'America/Sao_Paulo'
  from generate_series(date '2026-10-23', date '2026-10-25', interval '1 day') d;
  insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what, updated_at) values
  (ana, '2026-10-26', 52, 11200, 1, 'Treino de pernas', '2026-10-26 14:20-03');

  insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what, updated_at)
  select carla, d::date, 30, 9000, 1, 'Corrida · 5 km', (d::date + time '07:00') at time zone 'America/Sao_Paulo'
  from generate_series(date '2026-10-18', date '2026-10-25', interval '1 day') d;
  insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what, updated_at) values
  (carla, '2026-10-26', 34, 9800, 1, 'Corrida · 6,1 km', '2026-10-26 07:05-03'),
  (bruno, '2026-10-26', 0, 5400, 0, null, '2026-10-26 12:00-03');

  -- The demo user has not trained yet today (another domain may already own this row).
  insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what) values
  (seed.demo_user(), '2026-10-26', 0, 6842, 0, null)
  on conflict (user_id, day) do nothing;

  -- c1: owned by ana (the owner joins through the trigger).
  insert into public.challenges (id, owner_id, name, kind, min_value, days, starts_on) values
  (seed.demo_challenge(1), ana, 'Semana em movimento', 'day', 20, 7, '2026-10-26');
  insert into public.challenge_members (challenge_id, user_id) values
  (seed.demo_challenge(1), seed.demo_user()),
  (seed.demo_challenge(1), bruno),
  (seed.demo_challenge(1), carla)
  on conflict do nothing;

  -- Cheers the demo user received yesterday (the flows cheer ana/carla today, so none sent).
  insert into public.cheers (from_id, to_id, day) values
  (ana, seed.demo_user(), '2026-10-25'),
  (carla, seed.demo_user(), '2026-10-25');
end;
$$;

-- Curated inbox of the demo user. Runs after every social loader, so it first drops the
-- notifications their triggers generated (seed.load_demo skips that cleanup when this exists).
create or replace function seed.demo_41_inbox() returns void language plpgsql as $$
begin
  delete from public.notifications
  where owner_id in (select id from auth.users where email like '%@tracta.app');

  insert into public.notifications (id, owner_id, kind, title, body, href, created_at) values
  (seed.demo_notification(1), seed.demo_user(), 'workout', 'Hoje é dia de Treino A',
   'Peito & Tríceps · ~55 min. Você costuma treinar às 18:30.', '/workouts', '2026-10-26 08:00-03'),
  (seed.demo_notification(2), seed.demo_user(), 'social', 'Ana aceitou seu desafio',
   'O desafio de 7 dias começou. Ela está 1 treino à frente.', '/social', '2026-10-26 07:12-03'),
  (seed.demo_notification(3), seed.demo_user(), 'sync', 'Sono importado parcialmente',
   'A Mi Band não enviou os estágios das 03:10 às 04:00.', '/health', '2026-10-26 07:01-03'),
  (seed.demo_notification(4), seed.demo_user(), 'weekly', 'Resumo semanal pronto',
   '4 de 4 treinos e 32 km de corrida entre 19 e 25 out.', '/home/weekly', '2026-10-25 20:00-03'),
  (seed.demo_notification(5), seed.demo_user(), 'record', 'Novo recorde: Supino reto',
   '82,5 kg × 6 — 2,5 kg acima do anterior.', '/history', '2026-10-23 19:44-03'),
  (seed.demo_notification(6), seed.demo_user(), 'goal', 'Meta de passos atingida',
   '10.000 passos em 5 dos últimos 7 dias.', '/health', '2026-10-22 21:00-03');
end;
$$;

grant execute on all functions in schema seed to anon, authenticated;
