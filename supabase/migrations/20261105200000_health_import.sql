-- Workouts imported from the connected Health source (Apple Health, Health Connect, Google Health).
-- They live in the same tables as the ones recorded in Tracta, so history, summaries, challenges,
-- achievements and records count them the same way.
--   * external_source + external_id say where a row came from and make importing idempotent.
--   * dismissed_imports remembers the imported workouts the user deleted, so the next sync doesn't
--     bring them back.

alter table public.workout_sessions
  add column external_source text
    check (external_source in ('apple_health', 'health_connect', 'google_health')),
  add column external_id text check (char_length(external_id) between 1 and 200),
  add constraint workout_sessions_external_pair
    check ((external_source is null) = (external_id is null)),
  add constraint workout_sessions_external_unique unique (owner_id, external_source, external_id);

alter table public.activities
  add column external_source text
    check (external_source in ('apple_health', 'health_connect', 'google_health')),
  add column external_id text check (char_length(external_id) between 1 and 200),
  add constraint activities_external_pair
    check ((external_source is null) = (external_id is null)),
  add constraint activities_external_unique unique (owner_id, external_source, external_id);

create table public.dismissed_imports (
  owner_id uuid not null references auth.users (id) on delete cascade,
  external_source text not null,
  external_id text not null,
  dismissed_at timestamptz not null default now(),
  primary key (owner_id, external_source, external_id)
);
alter table public.dismissed_imports enable row level security;
create policy "dismissed_imports: owner reads" on public.dismissed_imports
  for select to authenticated using (owner_id = auth.uid());
revoke all on public.dismissed_imports from anon, authenticated;
grant select on public.dismissed_imports to authenticated;

-- Runs after a delete. When the whole account is going away the user row is already gone and there
-- is nothing to remember.
create or replace function public.remember_dismissed_import()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.external_id is not null
    and exists (select 1 from auth.users u where u.id = old.owner_id) then
    insert into public.dismissed_imports (owner_id, external_source, external_id)
    values (old.owner_id, old.external_source, old.external_id)
    on conflict do nothing;
  end if;
  return null;
end;
$$;
revoke execute on function public.remember_dismissed_import() from anon, authenticated, public;

create trigger workout_sessions_remember_dismissed_import
  after delete on public.workout_sessions
  for each row execute function public.remember_dismissed_import();
create trigger activities_remember_dismissed_import
  after delete on public.activities
  for each row execute function public.remember_dismissed_import();

-- -----------------------------------------------------------------------------
-- import_health_workouts(source, workouts): adds the workouts Tracta doesn't have yet and returns
-- how many. `workouts` is an array of { id, kind, started_at, ended_at, distance_m, avg_heart_rate }
-- where kind is an activity_kind or 'strength'. Skipped, in this order:
--   * dismissed: the user deleted it;
--   * known: already imported (a row the user may have annotated is left as it is);
--   * overlapping: nobody does two workouts at once, so one that shares at least half of the
--     shorter workout's time with an existing entry is the same workout recorded twice (a run
--     saved by Tracta and by a watch, or Tracta's own copy read back from the store).
-- -----------------------------------------------------------------------------
create or replace function public.import_health_workouts(p_source text, p_workouts jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_count integer := 0;
  w record;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(p_workouts) is distinct from 'array' or jsonb_array_length(p_workouts) > 500 then
    raise exception 'p_workouts must be an array of at most 500 workouts' using errcode = '22023';
  end if;
  if not exists (select 1 from public.health_connections where user_id = v_user) then
    raise exception 'health is not connected' using errcode = 'P0002';
  end if;

  for w in
    select x.id, x.kind, x.started_at, x.ended_at, x.distance_m, x.avg_heart_rate
    from jsonb_to_recordset(p_workouts) as x (
      id text, kind text, started_at timestamptz, ended_at timestamptz,
      distance_m integer, avg_heart_rate smallint
    )
    order by x.started_at
  loop
    continue when exists (
      select 1 from public.dismissed_imports d
      where d.owner_id = v_user and d.external_source = p_source and d.external_id = w.id
    );
    continue when exists (
      select 1 from public.activities a
      where a.owner_id = v_user and a.external_source = p_source and a.external_id = w.id
    ) or exists (
      select 1 from public.workout_sessions s
      where s.owner_id = v_user and s.external_source = p_source and s.external_id = w.id
    );
    continue when exists (
      select 1
      from (
        select s.started_at as from_at, s.ended_at as to_at
        from public.workout_sessions s
        where s.owner_id = v_user
        union all
        select a.started_at, a.started_at + make_interval(secs => a.duration_seconds)
        from public.activities a
        where a.owner_id = v_user
      ) e
      where e.from_at < w.ended_at and e.to_at > w.started_at
        and extract(epoch from least(e.to_at, w.ended_at) - greatest(e.from_at, w.started_at))
          >= 0.5 * least(
            extract(epoch from e.to_at - e.from_at),
            extract(epoch from w.ended_at - w.started_at)
          )
    );

    if w.kind = 'strength' then
      insert into public.workout_sessions (
        title, focus, started_at, ended_at, external_source, external_id
      )
      values ('Musculação', '', w.started_at, w.ended_at, p_source, w.id);
    else
      insert into public.activities (
        kind, started_at, duration_seconds, distance_m, avg_heart_rate, external_source, external_id
      )
      values (
        w.kind::public.activity_kind,
        w.started_at,
        round(extract(epoch from w.ended_at - w.started_at))::integer,
        w.distance_m,
        w.avg_heart_rate,
        p_source,
        w.id
      );
    end if;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
revoke execute on function public.import_health_workouts(text, jsonb) from anon, public;
grant execute on function public.import_health_workouts(text, jsonb) to authenticated;
