-- =============================================================================
-- Health demo data (what Apple Health would sync), Sep 27 → Oct 26 2026 for lucas@tracta.app.
-- Numbers reproduce the prototype: today 6 842 steps · 4,9 km · 312 kcal · 38 min active,
-- resting HR 58, last night 6h 50 asleep (23:48 → 07:00, 432 min in bed, 3 wake-ups, 22 min
-- awake), sleep score 85. Last 7 days of steps average 9 539. Bedtimes of the last 7 nights
-- average 23:41 (±18 min); the 7 before average 00:08 (±34 min) and 6h 45 of sleep.
-- Friends get the same steps their daily_summaries already show (40_social).
-- The demo user's E2E build syncs the same numbers again from its fake Health source.
-- =============================================================================

create or replace function seed.demo_50_health() returns void language plpgsql as $$
declare
  me uuid := seed.demo_user();
begin
  insert into public.health_connections (user_id, source, read_types, write_types, connected_at, last_synced_at)
  values (me, 'apple_health', '{steps,distance,active,resting,heart,sleep,workouts}', '{workouts}',
          '2026-09-01 09:00-03', '2026-10-26 16:12-03');

  -- day, steps, distance m, active kcal, rest kcal, active min, intense min,
  -- asleep min, awake min, wake-ups, bedtime (minutes from local midnight), resting HR
  insert into public.health_days (
    user_id, day, source, steps, distance_m, active_kcal, rest_kcal, active_minutes, intense_minutes,
    sleep_minutes, awake_minutes, in_bed_minutes, wakeups, bedtime, wake_time, resting_hr, hr_min, hr_max, synced_at
  )
  select me, v.day::date, 'apple_health', v.steps, v.dist, v.kcal, v.rest, v.act, v.intense,
    v.sleep, v.awake, v.sleep + v.awake, v.wakeups,
    (v.day::date::timestamp + make_interval(mins => v.bed)) at time zone 'America/Sao_Paulo',
    (v.day::date::timestamp + make_interval(mins => v.bed + v.sleep + v.awake)) at time zone 'America/Sao_Paulo',
    v.hr, v.hr - 6, v.hr + 44, (v.day::date + time '23:30') at time zone 'America/Sao_Paulo'
  from (values
    ('2026-09-27', 9082, 7000, 528, 1500, 36, 12, 410, 14, 2, -40, 62),
    ('2026-09-28', 12699, 6000, 495, 1529, 51, 17, 451, 21, 3, -3, 63),
    ('2026-09-29', 11066, 5000, 363, 1558, 44, 15, 449, 14, 2, -7, 60),
    ('2026-09-30', 9853, 8000, 412, 1587, 39, 13, 425, 21, 3, -11, 59),
    ('2026-10-01', 6371, 9000, 448, 1616, 25, 8, 390, 14, 2, -15, 58),
    ('2026-10-02', 8311, 10000, 567, 1645, 33, 11, 435, 21, 3, -19, 61),
    ('2026-10-03', 9537, 6000, 500, 1514, 38, 13, 471, 14, 2, -23, 62),
    ('2026-10-04', 12597, 6000, 454, 1543, 50, 17, 422, 21, 3, -27, 62),
    ('2026-10-05', 10130, 5000, 341, 1572, 41, 14, 399, 14, 2, -31, 59),
    ('2026-10-06', 8719, 9000, 419, 1601, 35, 12, 413, 21, 3, -35, 58),
    ('2026-10-07', 5891, 9000, 463, 1630, 24, 8, 461, 14, 2, -39, 58),
    ('2026-10-08', 8622, 9000, 560, 1659, 34, 11, 449, 21, 3, -2, 62),
    ('2026-10-09', 9912, 5000, 465, 1528, 40, 13, 434, 14, 2, -6, 62),
    ('2026-10-10', 12238, 5000, 416, 1557, 49, 16, 415, 21, 3, -10, 61),
    ('2026-10-11', 9043, 5000, 328, 1586, 36, 12, 396, 14, 2, -14, 57),
    ('2026-10-12', 7704, 9000, 431, 1615, 31, 10, 444, 21, 3, -18, 58),
    ('2026-10-13', 5669, 8000, 475, 1644, 23, 8, 380, 14, 2, 50, 58),
    ('2026-10-14', 9049, 8000, 545, 1513, 36, 12, 395, 21, 3, -40, 62),
    ('2026-10-15', 10134, 5000, 426, 1542, 41, 14, 470, 14, 2, 45, 61),
    ('2026-10-16', 11625, 5000, 383, 1571, 47, 16, 390, 21, 3, -30, 60),
    ('2026-10-17', 7877, 6000, 323, 1600, 32, 11, 400, 14, 2, 48, 57),
    ('2026-10-18', 6873, 9000, 447, 1629, 27, 9, 410, 21, 3, -25, 58),
    ('2026-10-19', 8412, 10000, 574, 1658, 34, 11, 390, 14, 2, 8, 61),
    ('2026-10-20', 8420, 6100, 410, 1527, 34, 11, 412, 14, 2, -40, 61),
    ('2026-10-21', 11230, 8200, 520, 1556, 45, 15, 445, 21, 3, -5, 60),
    ('2026-10-22', 7310, 5300, 360, 1585, 29, 10, 398, 14, 2, -35, 62),
    ('2026-10-23', 10450, 7600, 480, 1614, 42, 14, 470, 21, 3, 0, 59),
    ('2026-10-24', 12880, 12400, 610, 1643, 52, 17, 488, 14, 2, 5, 60),
    ('2026-10-25', 9640, 7000, 450, 1512, 39, 13, 455, 21, 3, -45, 61)
  ) as v (day, steps, dist, kcal, rest, act, intense, sleep, awake, wakeups, bed, hr);

  -- Today, until 16:12 (hourly steps and heart rate, hypnogram of last night).
  insert into public.health_days (
    user_id, day, source, steps, distance_m, active_kcal, rest_kcal, active_minutes, intense_minutes,
    steps_hourly, sleep_minutes, in_bed_minutes, awake_minutes, wakeups, bedtime, wake_time,
    sleep_stages, resting_hr, hr_min, hr_max, hr_hourly, synced_at
  ) values (
    me, '2026-10-26', 'apple_health', 6842, 4900, 312, 1120, 38, 12,
    '{0,0,0,0,0,0,120,640,820,310,260,410,980,540,380,620,1762,0,0,0,0,0,0,0}',
    410, 432, 22, 3, '2026-10-25 23:48-03', '2026-10-26 07:00-03',
    '[["light",18],["deep",42],["light",30],["rem",16],["light",34],["deep",30],["light",22],["awake",6],["rem",24],["light",40],["deep",18],["light",32],["rem",28],["light",30],["awake",8],["rem",26],["light",20],["awake",8]]',
    58, 52, 92,
    '{56,54,53,52,52,53,58,72,84,78,74,80,92,76,73,79,88,NULL,NULL,NULL,NULL,NULL,NULL,NULL}',
    '2026-10-26 16:12-03'
  );

  -- Friends (steps equal to their daily summaries, so the social feed does not change).
  insert into public.health_connections (user_id, source) values
  (seed.friend('ana'), 'apple_health'), (seed.friend('bruno'), 'health_connect'), (seed.friend('carla'), 'apple_health');
  insert into public.health_days (user_id, day, source, steps, sleep_minutes, resting_hr)
  select seed.friend('ana'), d::date, 'apple_health', 9500, 445, 56
  from generate_series(date '2026-10-23', date '2026-10-25', interval '1 day') d;
  insert into public.health_days (user_id, day, source, steps, sleep_minutes, resting_hr)
  select seed.friend('carla'), d::date, 'apple_health', 9000, 470, 52
  from generate_series(date '2026-10-18', date '2026-10-25', interval '1 day') d;
  insert into public.health_days (user_id, day, source, steps, sleep_minutes, resting_hr) values
  (seed.friend('ana'), '2026-10-26', 'apple_health', 11200, 430, 55),
  (seed.friend('carla'), '2026-10-26', 'apple_health', 9800, 462, 51),
  (seed.friend('bruno'), '2026-10-26', 'health_connect', 5400, 390, 64);
end;
$$;
