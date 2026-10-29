-- =============================================================================
-- Logging & history (additive):
--   * activities.avg_heart_rate (from the band via Apple Health; null without a sensor)
--   * daily_summaries kept in sync with workout_sessions / activities (social feed)
--   * history_entries: one row per strength session or activity (History tab reads)
-- =============================================================================

alter table public.activities
  add column avg_heart_rate smallint check (avg_heart_rate is null or avg_heart_rate between 30 and 250);

-- Calendar day of a logged entry. There is no per-user time zone yet: the product launches in
-- Brazil, so days are cut in São Paulo time (the app buckets its own reads in device time).
create or replace function public.app_time_zone()
returns text
language sql
immutable
set search_path = ''
as $$ select 'America/Sao_Paulo' $$;

create or replace function public.local_day(p_at timestamptz)
returns date
language sql
stable
set search_path = ''
as $$ select (p_at at time zone public.app_time_zone())::date $$;

-- pt-BR label of an activity kind, used in the friends feed ("Corrida · 5,1 km").
create or replace function public.activity_label(p_kind public.activity_kind)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_kind
    when 'run' then 'Corrida'
    when 'walk' then 'Caminhada'
    when 'bike' then 'Pedal'
    when 'swim' then 'Natação'
    when 'soccer' then 'Futebol'
    when 'basket' then 'Basquete'
    when 'tennis' then 'Tênis'
    when 'functional' then 'Funcional'
    when 'stretch' then 'Alongamento'
    when 'yoga' then 'Yoga'
  end
$$;

-- -----------------------------------------------------------------------------
-- history_entries: strength sessions and activities in one list (RLS of the caller applies).
-- -----------------------------------------------------------------------------
create view public.history_entries with (security_invoker = true) as
select
  s.id,
  s.owner_id,
  'strength'::text as kind,
  s.started_at,
  t.duration_seconds,
  s.title,
  s.focus,
  s.routine_id,
  t.sets,
  t.volume_kg,
  null::integer as distance_m,
  null::smallint as avg_heart_rate
from public.workout_sessions s
join public.session_totals t on t.session_id = s.id
union all
select
  a.id,
  a.owner_id,
  a.kind::text,
  a.started_at,
  a.duration_seconds,
  null::text,
  null::text,
  null::uuid,
  null::integer,
  null::numeric(10, 2),
  a.distance_m,
  a.avg_heart_rate
from public.activities a;

revoke all on public.history_entries from anon;
grant select on public.history_entries to authenticated;

-- -----------------------------------------------------------------------------
-- daily_summaries sync: recompute one (user, day) from the logged entries.
-- Steps stay untouched (they come from Health); an empty day without steps is removed.
-- -----------------------------------------------------------------------------
create or replace function public.refresh_daily_summary(p_user uuid, p_day date)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_seconds bigint;
  v_what text;
begin
  with entries as (
    select
      greatest(0, extract(epoch from (s.ended_at - s.started_at))::integer - s.paused_seconds) as seconds,
      s.title || ' · ' || round(greatest(0, extract(epoch from (s.ended_at - s.started_at)) - s.paused_seconds) / 60)::integer || ' min' as what,
      s.started_at
    from public.workout_sessions s
    where s.owner_id = p_user and public.local_day(s.started_at) = p_day
    union all
    select
      a.duration_seconds,
      public.activity_label(a.kind) || ' · ' || case
        when coalesce(a.distance_m, 0) > 0
          then replace(to_char(round(a.distance_m / 1000.0, 1), 'FM9990.0'), '.', ',') || ' km'
        else round(a.duration_seconds / 60.0)::integer || ' min'
      end,
      a.started_at
    from public.activities a
    where a.owner_id = p_user and public.local_day(a.started_at) = p_day
  )
  select
    count(*),
    coalesce(sum(seconds), 0),
    (select e.what from entries e order by e.seconds desc, e.started_at asc limit 1)
  into v_count, v_seconds, v_what
  from entries;

  if v_count = 0 then
    delete from public.daily_summaries where user_id = p_user and day = p_day and steps = 0;
    update public.daily_summaries
      set workouts = 0, active_minutes = 0, what = null
      where user_id = p_user and day = p_day;
    return;
  end if;

  -- The user may be going away in this very statement (account deletion cascades).
  if not exists (select 1 from auth.users where id = p_user) then
    return;
  end if;

  insert into public.daily_summaries (user_id, day, workouts, active_minutes, what)
  values (p_user, p_day, least(v_count, 32767), least(1440, round(v_seconds / 60.0))::integer, left(v_what, 80))
  on conflict (user_id, day) do update
    set workouts = excluded.workouts,
        active_minutes = excluded.active_minutes,
        what = excluded.what;
end;
$$;

revoke execute on function public.refresh_daily_summary(uuid, date) from anon, authenticated, public;

create or replace function public.sync_daily_summary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_daily_summary(old.owner_id, public.local_day(old.started_at));
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.refresh_daily_summary(new.owner_id, public.local_day(new.started_at));
  end if;
  return null;
end;
$$;

revoke execute on function public.sync_daily_summary() from anon, authenticated, public;

create trigger workout_sessions_sync_daily_summary
  after insert or delete or update of started_at, ended_at, paused_seconds, title, owner_id
  on public.workout_sessions
  for each row execute function public.sync_daily_summary();

create trigger activities_sync_daily_summary
  after insert or delete or update of started_at, duration_seconds, distance_m, kind, owner_id
  on public.activities
  for each row execute function public.sync_daily_summary();
