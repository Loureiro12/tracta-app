-- =============================================================================
-- Achievements (badges), monthly recap and weekly summary (additive, read-only).
-- Everything is computed from the caller's logged entries (history_entries, session_sets,
-- activities); nothing is stored. Functions run as the caller (security invoker), so RLS
-- limits every read to the caller's own rows. "Today" always comes from the client.
--
--   current_streak(day)            consecutive active days ending that day (or the day before)
--   strength_records(from, to)     strength personal records set in [from, to]
--   achievements(today)            the 8 badges with earned_on or progress 0..1
--   monthly_recap(today)           month-to-date recap (History › Recap stories)
--   weekly_summary(week_start)     Monday–Sunday summary vs the previous week (Home › Weekly)
--
-- An "active day" is a local day (America/Sao_Paulo) with at least one logged strength session
-- or activity (run, walk, bike…). Weeks run Monday–Sunday.
-- =============================================================================

-- Consecutive active days ending on p_day; when p_day has nothing yet, ending the day before
-- (a streak is not broken until the day is over).
create or replace function public.current_streak(p_day date)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  with days as (
    select distinct public.local_day(h.started_at) as day
    from public.history_entries h
    where h.owner_id = auth.uid() and public.local_day(h.started_at) <= p_day
  ),
  anchor as (
    select case when exists (select 1 from days where day = p_day) then p_day else p_day - 1 end as day
  ),
  ranked as (
    select d.day, row_number() over (order by d.day desc)::integer as rn
    from days d, anchor a
    where d.day <= a.day
  )
  select count(*)::integer
  from ranked r, anchor a
  where r.day = a.day - (r.rn - 1);
$$;

-- Strength personal records set between p_from and p_to (local days, inclusive): for each
-- exercise, the latest session in the range whose best working set beats every earlier session
-- (heavier, then more reps; bodyweight compares reps). The first time an exercise is logged is
-- not a record. previous_* = best before that session, first_kg = load of the first session.
create or replace function public.strength_records(p_from date, p_to date)
returns table (
  exercise_id uuid,
  slug text,
  name text,
  kg numeric,
  reps smallint,
  previous_kg numeric,
  previous_reps smallint,
  first_kg numeric,
  achieved_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  with best as (
    select distinct on (ss.exercise_id, s.id)
      ss.exercise_id, s.id as session_id, s.started_at, ss.kg, ss.reps,
      (coalesce(ss.kg, 0) * 100)::bigint * 1000 + ss.reps as score
    from public.session_sets ss
    join public.workout_sessions s on s.id = ss.session_id
    where s.owner_id = auth.uid()
      and not ss.is_warmup and ss.reps > 0
      and public.local_day(s.started_at) <= p_to
    order by ss.exercise_id, s.id, ss.kg desc nulls last, ss.reps desc
  ),
  ranked as (
    select b.*,
      max(b.score) over (partition by b.exercise_id order by b.started_at, b.session_id
                         rows between unbounded preceding and 1 preceding) as prior,
      first_value(b.kg) over (partition by b.exercise_id order by b.started_at, b.session_id) as first_kg
    from best b
  ),
  records as (
    select distinct on (r.exercise_id) r.*
    from ranked r
    where r.prior is not null and r.score > r.prior
      and public.local_day(r.started_at) between p_from and p_to
    order by r.exercise_id, r.started_at desc
  )
  select r.exercise_id, e.slug, e.name, r.kg, r.reps,
    case when (r.prior / 1000) > 0 then round((r.prior / 1000)::numeric / 100, 2) end,
    (r.prior % 1000)::smallint,
    r.first_kg,
    r.started_at
  from records r
  join public.exercises e on e.id = r.exercise_id
  order by r.started_at desc, r.kg desc nulls last;
$$;

-- Fastest window of p_size consecutive full-km splits of each of the caller's runs up to p_to
-- (same rule as the records screen: also inside longer runs).
create or replace function public.run_windows(p_size integer, p_from date, p_to date)
returns table (activity_id uuid, day date, seconds numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with full_splits as (
    select a.id, a.started_at, (sp.value ->> 'seconds')::numeric as sec,
      row_number() over (partition by a.id order by sp.ordinality) as rn
    from public.activities a
    cross join lateral jsonb_array_elements(a.splits) with ordinality as sp(value, ordinality)
    where a.owner_id = auth.uid() and a.kind = 'run'
      and public.local_day(a.started_at) between p_from and p_to
      and (sp.value ->> 'km')::numeric >= 1
  ),
  windows as (
    select f.id, f.started_at, f.rn,
      sum(f.sec) over (partition by f.id order by f.rn rows between p_size - 1 preceding and current row) as total
    from full_splits f
  )
  select w.id, public.local_day(min(w.started_at)), min(w.total)
  from windows w
  where w.rn >= p_size
  group by w.id;
$$;

-- The caller's entries up to p_today with their local day (input of achievements()).
create or replace function public.achievement_entries(p_today date)
returns table (started_at timestamptz, day date, kind text, volume_kg numeric, distance_m integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select h.started_at, public.local_day(h.started_at), h.kind, h.volume_kg, h.distance_m
  from public.history_entries h
  where h.owner_id = auth.uid() and public.local_day(h.started_at) <= p_today;
$$;

-- -----------------------------------------------------------------------------
-- achievements(p_today): one row per badge, in catalog order.
--   streak12 / streak30   12 / 30 consecutive active days. progress = longest streak / N.
--   workouts50 / 100      50 / 100 logged entries (sessions + activities). earned_on = day of
--                         the Nth entry; progress = count / N.
--   first5k               first run with distance ≥ 5 km. progress = longest run / 5 km.
--   oneTon                first strength session with ≥ 1 000 kg of working-set volume.
--   tenKSub55             10 consecutive full-km splits in < 55:00 (3 300 s), also inside
--                         longer runs. current = best 10 km seconds; progress = 3 300 / best.
--   perfectMonth          a calendar month in which every week whose Monday falls in it reached
--                         the weekly workout goal (goals.workouts_per_week, current value).
--                         earned_on = day the last week reached the goal. current/target =
--                         weeks reached / weeks of the month of p_today.
-- earned_on is null while locked; progress is 1 once earned. Entries after p_today are ignored.
-- -----------------------------------------------------------------------------
create or replace function public.achievements(p_today date)
returns table (id text, earned_on date, progress numeric, current numeric, target numeric)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_goal integer;
  v_count integer;
  v_best_streak integer;
  v_streak12 date;
  v_streak30 date;
  v_w50 date;
  v_w100 date;
  v_first5k date;
  v_longest_run numeric;
  v_one_ton date;
  v_max_volume numeric;
  v_ten_k date;
  v_best_10k numeric;
  v_perfect date;
  v_month_weeks integer;
  v_month_hits integer;
begin
  select coalesce((select g.workouts_per_week from public.goals g where g.user_id = auth.uid()), 4)
    into v_goal;

  select count(*) into v_count from public.achievement_entries(p_today);

  -- Streaks: islands of consecutive active days.
  with days as (select distinct e.day from public.achievement_entries(p_today) e),
  islands as (
    select min(d.day) as first_day, count(*)::integer as len
    from (select day, day - (row_number() over (order by day))::integer as grp from days) d
    group by d.grp
  )
  select coalesce(max(len), 0),
    min(first_day + 11) filter (where len >= 12),
    min(first_day + 29) filter (where len >= 30)
  into v_best_streak, v_streak12, v_streak30
  from islands;

  select e.day into v_w50 from public.achievement_entries(p_today) e order by e.started_at offset 49 limit 1;
  select e.day into v_w100 from public.achievement_entries(p_today) e order by e.started_at offset 99 limit 1;

  select min(e.day) filter (where e.distance_m >= 5000), coalesce(max(e.distance_m), 0)
  into v_first5k, v_longest_run
  from public.achievement_entries(p_today) e where e.kind = 'run';

  select min(e.day) filter (where e.volume_kg >= 1000), coalesce(max(e.volume_kg), 0)
  into v_one_ton, v_max_volume
  from public.achievement_entries(p_today) e where e.kind = 'strength';

  select min(w.day) filter (where w.seconds < 3300), min(w.seconds)
  into v_ten_k, v_best_10k
  from public.run_windows(10, '-infinity'::date, p_today) w;

  -- Weekly goal: the day each Monday–Sunday week reached v_goal entries.
  with numbered as (
    select e.day, e.day - (extract(isodow from e.day)::integer - 1) as week,
      row_number() over (partition by e.day - (extract(isodow from e.day)::integer - 1) order by e.started_at) as n
    from public.achievement_entries(p_today) e
  ),
  hits as (select week, day from numbered where n = v_goal),
  months as (
    select m::date as month
    from generate_series(
      date_trunc('month', coalesce((select min(day) from public.achievement_entries(p_today)), p_today)::timestamp),
      date_trunc('month', p_today::timestamp), interval '1 month') m
  ),
  month_weeks as (
    select mo.month, w::date as week
    from months mo
    cross join lateral generate_series(
      mo.month + ((8 - extract(isodow from mo.month)::integer) % 7),
      (mo.month + interval '1 month' - interval '1 day')::date, interval '7 days') w
  ),
  per_month as (
    select mw.month, count(*)::integer as weeks, count(h.day)::integer as hit, max(h.day) as last_hit
    from month_weeks mw
    left join hits h on h.week = mw.week
    group by mw.month
  )
  select
    min(pm.last_hit) filter (where pm.hit = pm.weeks),
    max(pm.weeks) filter (where pm.month = date_trunc('month', p_today::timestamp)::date),
    max(pm.hit) filter (where pm.month = date_trunc('month', p_today::timestamp)::date)
  into v_perfect, v_month_weeks, v_month_hits
  from per_month pm;

  return query
  select b.id, b.earned_on,
    case when b.earned_on is not null then 1::numeric
         else trunc(least(1, greatest(0, b.raw)), 3) end,
    b.current, b.target
  from (values
    (1, 'streak12', v_streak12, v_best_streak / 12.0, v_best_streak::numeric, 12::numeric),
    (2, 'workouts50', v_w50, v_count / 50.0, v_count::numeric, 50::numeric),
    (3, 'first5k', v_first5k, v_longest_run / 5000.0, v_longest_run, 5000::numeric),
    (4, 'oneTon', v_one_ton, v_max_volume / 1000.0, v_max_volume, 1000::numeric),
    (5, 'perfectMonth', v_perfect, coalesce(v_month_hits::numeric / nullif(v_month_weeks, 0), 0),
       coalesce(v_month_hits, 0)::numeric, coalesce(v_month_weeks, 0)::numeric),
    (6, 'tenKSub55', v_ten_k, coalesce(3300 / nullif(v_best_10k, 0), 0), v_best_10k, 3300::numeric),
    (7, 'streak30', v_streak30, v_best_streak / 30.0, v_best_streak::numeric, 30::numeric),
    (8, 'workouts100', v_w100, v_count / 100.0, v_count::numeric, 100::numeric)
  ) as b(ord, id, earned_on, raw, current, target)
  order by b.ord;
end;
$$;

-- -----------------------------------------------------------------------------
-- monthly_recap(p_today): the month of p_today up to p_today (month to date), compared with
-- the whole previous month. Amounts are raw (metres, seconds, kg); the app formats them.
-- -----------------------------------------------------------------------------
create or replace function public.monthly_recap(p_today date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_from date := date_trunc('month', p_today::timestamp)::date;
  v_prev date := (date_trunc('month', p_today::timestamp) - interval '1 month')::date;
  v_result jsonb;
begin
  with e as (
    select h.*, public.local_day(h.started_at) as day
    from public.history_entries h
    where h.owner_id = auth.uid() and public.local_day(h.started_at) between v_from and p_today
  ),
  runs as (select * from e where kind = 'run'),
  strength as (select * from e where kind = 'strength')
  select jsonb_build_object(
    'month', v_from,
    'to', p_today,
    'workouts', (select count(*) from e),
    'previousWorkouts', (
      select count(*) from public.history_entries h
      where h.owner_id = auth.uid() and public.local_day(h.started_at) between v_prev and v_from - 1),
    'strengthSessions', (select count(*) from strength),
    'runs', (select count(*) from runs),
    'favoriteWeekday', (
      select extract(isodow from day)::integer - 1 from e
      group by 1 order by count(*) desc, 1 limit 1),
    'runDistanceM', (select coalesce(sum(distance_m), 0) from runs),
    'runSeconds', (select coalesce(sum(duration_seconds), 0) from runs where coalesce(distance_m, 0) > 0),
    'longestRunM', (select max(distance_m) from runs),
    'best5kSeconds', (select min(w.seconds) from public.run_windows(5, v_from, p_today) w),
    'volumeKg', (select coalesce(sum(volume_kg), 0) from strength),
    'sets', (select coalesce(sum(sets), 0) from strength),
    'avgStrengthSeconds', (select round(avg(duration_seconds)) from strength),
    'topFocus', (
      select focus from strength where focus <> ''
      group by focus order by count(*) desc, sum(volume_kg) desc limit 1),
    'topExercise', (
      select ex.name
      from public.session_sets ss
      join strength s on s.id = ss.session_id
      join public.exercises ex on ex.id = ss.exercise_id
      where not ss.is_warmup and ss.kg is not null
      group by ex.id, ex.name order by sum(ss.kg * ss.reps) desc limit 1),
    'streakDays', public.current_streak(p_today),
    'records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'exerciseId', r.exercise_id, 'slug', r.slug, 'name', r.name, 'kg', r.kg, 'reps', r.reps,
        'previousKg', r.previous_kg, 'previousReps', r.previous_reps, 'firstKg', r.first_kg,
        'achievedAt', r.achieved_at) order by r.achieved_at desc, r.kg desc nulls last)
      from public.strength_records(v_from, p_today) r), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- weekly_summary(p_week_start): Monday p_week_start .. Sunday, vs the previous week.
-- -----------------------------------------------------------------------------
create or replace function public.weekly_summary(p_week_start date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_end date := p_week_start + 6;
  v_prev date := p_week_start - 7;
  v_result jsonb;
begin
  if p_week_start is null or extract(isodow from p_week_start) <> 1 then
    raise exception 'week must start on a Monday' using errcode = '22023';
  end if;

  with e as (
    select h.*, public.local_day(h.started_at) as day, (h.kind = 'run' and coalesce(h.distance_m, 0) > 0) as gps_run
    from public.history_entries h
    where h.owner_id = auth.uid() and public.local_day(h.started_at) between v_prev and v_end
  ),
  cur as (select * from e where day >= p_week_start),
  prev as (select * from e where day < p_week_start),
  longest as (select * from cur where gps_run order by distance_m desc, started_at limit 1)
  select jsonb_build_object(
    'weekStart', p_week_start,
    'goal', coalesce((select g.workouts_per_week from public.goals g where g.user_id = auth.uid()), 4),
    'workouts', (select count(*) from cur),
    'strengthSessions', (select count(*) from cur where kind = 'strength'),
    'runs', (select count(*) from cur where gps_run),
    'activeSeconds', (select coalesce(sum(duration_seconds), 0) from cur),
    'runDistanceM', (select coalesce(sum(distance_m), 0) from cur where gps_run),
    'runSeconds', (select coalesce(sum(duration_seconds), 0) from cur where gps_run),
    'volumeKg', (select coalesce(sum(volume_kg), 0) from cur),
    'activeDays', (select count(distinct day) from cur),
    'streakDays', public.current_streak(v_end),
    'previous', jsonb_build_object(
      'workouts', (select count(*) from prev),
      'activeSeconds', (select coalesce(sum(duration_seconds), 0) from prev),
      'runDistanceM', (select coalesce(sum(distance_m), 0) from prev where gps_run),
      'runSeconds', (select coalesce(sum(duration_seconds), 0) from prev where gps_run),
      'volumeKg', (select coalesce(sum(volume_kg), 0) from prev)
    ),
    'days', (
      select jsonb_agg(jsonb_build_object(
        'day', d.day,
        'kind', case
          when exists (select 1 from cur where cur.day = d.day and cur.kind = 'strength') then 'strength'
          when exists (select 1 from cur where cur.day = d.day and cur.kind = 'run') then 'run'
          when exists (select 1 from cur where cur.day = d.day) then 'other'
          else 'rest' end,
        'label', (
          select r.label from cur
          join public.routines r on r.id = cur.routine_id
          where cur.day = d.day and cur.kind = 'strength'
          order by cur.started_at limit 1)
      ) order by d.day)
      from (select (p_week_start + i) as day from generate_series(0, 6) i) d
    ),
    'records', coalesce((
      select jsonb_agg(jsonb_build_object(
        'exerciseId', r.exercise_id, 'slug', r.slug, 'name', r.name, 'kg', r.kg, 'reps', r.reps,
        'previousKg', r.previous_kg, 'previousReps', r.previous_reps, 'firstKg', r.first_kg,
        'achievedAt', r.achieved_at) order by r.achieved_at, r.kg desc nulls last)
      from public.strength_records(p_week_start, v_end) r), '[]'::jsonb),
    'longestRun', (
      select jsonb_build_object(
        'activityId', l.id,
        'distanceM', l.distance_m,
        'day', l.day,
        'longestOfMonth', not exists (
          select 1 from public.activities a
          where a.owner_id = auth.uid() and a.kind = 'run' and a.id <> l.id
            and public.local_day(a.started_at) between date_trunc('month', l.day::timestamp)::date and v_end
            and a.distance_m > l.distance_m))
      from longest l)
  ) into v_result;
  return v_result;
end;
$$;

revoke execute on function public.current_streak(date) from anon, public;
revoke execute on function public.strength_records(date, date) from anon, public;
revoke execute on function public.run_windows(integer, date, date) from anon, public;
revoke execute on function public.achievements(date) from anon, public;
revoke execute on function public.achievement_entries(date) from anon, public;
revoke execute on function public.monthly_recap(date) from anon, public;
revoke execute on function public.weekly_summary(date) from anon, public;
grant execute on function public.current_streak(date) to authenticated;
grant execute on function public.strength_records(date, date) to authenticated;
grant execute on function public.run_windows(integer, date, date) to authenticated;
grant execute on function public.achievements(date) to authenticated;
grant execute on function public.achievement_entries(date) to authenticated;
grant execute on function public.monthly_recap(date) to authenticated;
grant execute on function public.weekly_summary(date) to authenticated;
