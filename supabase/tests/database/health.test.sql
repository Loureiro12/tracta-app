-- Health: owner-only RLS, the sync RPC and the daily_summaries.steps mirror.
begin;
select plan(17);

select tests.create_user('hana_hl') as hana \gset
select tests.create_user('ivo_hl') as ivo \gset

-- A summary with a workout already exists for Oct 25 (logged session), keep its updated_at.
insert into public.daily_summaries (user_id, day, workouts, active_minutes, what, updated_at)
values (:'hana', '2026-10-25', 1, 50, 'Treino A · 50 min', '2026-10-25 19:00Z');

-- Not connected yet: the sync RPC refuses.
select tests.authenticate_as(:'hana');
select throws_ok(
  $$select public.upsert_health_days('apple_health', '[{"day":"2026-10-26","steps":100}]')$$,
  'P0002', null, 'sync needs a connection'
);
insert into public.health_connections (source, read_types) values ('apple_health', '{steps,sleep}');
select isnt(
  public.upsert_health_days('apple_health', $$[
    {"day":"2026-10-25","steps":9640,"sleep_minutes":455,"resting_hr":61},
    {"day":"2026-10-26","steps":6842,"distance_m":4900,"steps_hourly":[0,0,0,0,0,0,120,640,820,310,260,410,980,540,380,620,1762,0,0,0,0,0,0,0],
     "sleep_stages":[["light",18],["deep",42]],"bedtime":"2026-10-25T23:48:00-03:00","wake_time":"2026-10-26T07:00:00-03:00"}
  ]$$::jsonb),
  null, 'sync returns the sync instant'
);
select is((select count(*)::int from public.health_days), 2, 'two days stored');
select is((select steps_hourly[17] from public.health_days where day = '2026-10-26'), 1762, 'hourly steps kept in order');
select isnt((select last_synced_at from public.health_connections), null, 'last sync stamped');
select is(
  (select steps from public.daily_summaries where day = '2026-10-26'), 6842,
  'steps mirrored into daily_summaries'
);
select is(
  (select (steps, workouts, updated_at) from public.daily_summaries where day = '2026-10-25'),
  (9640, 1::smallint, '2026-10-25 19:00Z'::timestamptz),
  'steps added to an existing summary without moving its updated_at'
);

-- Re-syncing replaces the day.
select public.upsert_health_days('apple_health', '[{"day":"2026-10-26","steps":7000}]');
select is((select (steps, distance_m) from public.health_days where day = '2026-10-26'), (7000, null::integer), 'a re-sync replaces the day');
select is((select steps from public.daily_summaries where day = '2026-10-26'), 7000, 'summary follows the re-sync');

-- Validation.
select throws_ok(
  $$select public.upsert_health_days('apple_health', '[{"day":"2026-10-26","steps":-5}]')$$,
  '23514', null, 'negative steps rejected'
);
select throws_ok(
  $$select public.upsert_health_days('apple_health', '{"day":"2026-10-26"}')$$,
  '22023', null, 'days must be an array'
);
select throws_ok(
  $$select public.upsert_health_days('fitbit', '[{"day":"2026-10-26","steps":1}]')$$,
  '23514', null, 'unknown source rejected'
);
select tests.clear_authentication();

-- Another user sees and changes nothing.
select tests.authenticate_as(:'ivo');
select is((select count(*)::int from public.health_days), 0, 'stranger reads no health days');
select is((select count(*)::int from public.health_connections), 0, 'stranger reads no connection');
delete from public.health_days where user_id = :'hana';
select tests.clear_authentication();
select is((select count(*)::int from public.health_days where user_id = :'hana'), 2, 'stranger cannot delete');

-- The owner deletes her synced data: steps drop from the summaries, workout days stay.
select tests.authenticate_as(:'hana');
delete from public.health_days;
delete from public.health_connections;
select tests.clear_authentication();
select is(
  (select array_agg(day order by day)::text from public.daily_summaries where user_id = :'hana'),
  '{2026-10-25}', 'empty summary removed, workout day kept'
);
select is((select steps from public.daily_summaries where user_id = :'hana'), 0, 'steps zeroed');

select * from finish();
rollback;
