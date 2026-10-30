-- =============================================================================
-- Older demo history (April–July 2026) so the achievements screen shows earned badges.
-- Everything here is before the 12-week evolution window (Aug 3) and lighter/slower than the
-- records in 30_logging.sql, so History, evolution and records keep their numbers.
--   * May 11–22: 12 consecutive active days (strength, short runs, walks) → streak12 (May 22).
--   * 31 entries here + 33 in 30_logging = 64 workouts → workouts50 (Sep 30), 64 of 100.
--   * No month where every week reaches the 4-workout goal → perfectMonth 3 of 4 (October).
--   * Runs here are < 5 km, so first5k stays on Jun 7 and the 10 km best stays 58:12.
-- =============================================================================

create or replace function seed.achievements_strength(p_label text, p_day date)
returns void
language plpgsql
as $$
begin
  perform seed.logging_session(p_label, p_day + time '18:40', 50, case p_label
    when 'A' then '[[0,0,45,8],[0,1,45,8],[0,2,45,7],[1,0,15,10],[1,1,15,10],[2,0,25,12],[2,1,25,12],[3,0,17.5,12],[3,1,17.5,12],[4,0,null,2]]'::jsonb
    when 'B' then '[[0,0,40,10],[0,1,40,10],[0,2,40,9],[1,0,35,8],[1,1,35,8],[2,0,32.5,12],[2,1,32.5,12],[3,0,10,10],[3,1,10,10]]'::jsonb
    else '[[0,0,55,6],[0,1,55,6],[0,2,55,6],[1,0,110,10],[1,1,110,10],[2,0,30,12],[2,1,30,12],[3,0,32.5,10],[3,1,32.5,10],[4,0,40,15],[4,1,40,15]]'::jsonb
  end);
end;
$$;

-- Short manual run (4 km at 6:10 /km) or walk (3 km in 35 min).
create or replace function seed.achievements_activity(p_kind public.activity_kind, p_day date)
returns void
language sql
as $$
  insert into public.activities (owner_id, kind, started_at, duration_seconds, distance_m, gps, splits)
  values (
    seed.demo_user(), p_kind, (p_day + time '07:10') at time zone 'America/Sao_Paulo',
    case when p_kind = 'run' then 1480 else 2100 end,
    case when p_kind = 'run' then 4000 else 3000 end,
    false,
    case when p_kind = 'run'
      then '[{"km": 1, "seconds": 370}, {"km": 1, "seconds": 370}, {"km": 1, "seconds": 370}, {"km": 1, "seconds": 370}]'::jsonb
      else '[]'::jsonb end
  );
$$;

create or replace function seed.demo_37_achievements() returns void language plpgsql as $$
declare
  e record;
begin
  for e in
    select * from (values
      -- April: two per week.
      ('A', '2026-04-06'), ('B', '2026-04-08'), ('A', '2026-04-13'), ('C', '2026-04-15'),
      ('B', '2026-04-20'), ('run', '2026-04-22'), ('A', '2026-04-27'),
      -- May: the 12-day streak (May 11–22) between two lighter weeks.
      ('C', '2026-05-04'), ('run', '2026-05-06'),
      ('A', '2026-05-11'), ('walk', '2026-05-12'), ('B', '2026-05-13'), ('run', '2026-05-14'),
      ('C', '2026-05-15'), ('walk', '2026-05-16'), ('walk', '2026-05-17'), ('A', '2026-05-18'),
      ('run', '2026-05-19'), ('B', '2026-05-20'), ('walk', '2026-05-21'), ('C', '2026-05-22'),
      ('A', '2026-05-25'), ('B', '2026-05-27'),
      -- June (plus the Jun 7 long run of 30_logging) and early July.
      ('C', '2026-06-01'), ('run', '2026-06-03'), ('A', '2026-06-10'), ('B', '2026-06-15'),
      ('walk', '2026-06-17'), ('C', '2026-06-24'),
      ('A', '2026-07-01'), ('B', '2026-07-08')
    ) as v (what, day)
  loop
    if e.what in ('A', 'B', 'C') then
      perform seed.achievements_strength(e.what, e.day::date);
    else
      perform seed.achievements_activity(e.what::public.activity_kind, e.day::date);
    end if;
  end loop;
end;
$$;
