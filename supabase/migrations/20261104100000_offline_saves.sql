-- Offline saves: the app queues finished workouts and activities on the device and may send the
-- same one more than once (a response lost on a bad connection looks like a failure). A
-- client-generated id makes those writes idempotent. NULLs stay distinct, so rows saved without
-- a client_id are unaffected.

alter table public.workout_sessions add column client_id uuid;
alter table public.workout_sessions
  add constraint workout_sessions_client_id_unique unique (owner_id, client_id);

alter table public.activities add column client_id uuid;
alter table public.activities
  add constraint activities_client_id_unique unique (owner_id, client_id);

-- Replaying a clientId returns the session already saved and adds no sets. A routine deleted
-- while the workout waited on the device must not lose the workout, so it is saved without the
-- link (the title keeps the routine's name).
create or replace function public.save_workout_session(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_id uuid;
  cid uuid := nullif(payload ->> 'clientId', '')::uuid;
  rid uuid;
begin
  if jsonb_typeof(payload -> 'sets') is distinct from 'array' then
    raise exception 'sets must be an array' using errcode = '22023';
  end if;

  select r.id into rid
  from public.routines r
  where r.id = nullif(payload ->> 'routineId', '')::uuid;

  insert into public.workout_sessions (routine_id, title, focus, started_at, ended_at, paused_seconds, notes, client_id)
  values (
    rid,
    payload ->> 'title',
    coalesce(payload ->> 'focus', ''),
    (payload ->> 'startedAt')::timestamptz,
    (payload ->> 'endedAt')::timestamptz,
    coalesce((payload ->> 'pausedSeconds')::integer, 0),
    coalesce(payload ->> 'notes', ''),
    cid
  )
  on conflict (owner_id, client_id) do nothing
  returning id into new_id;

  if new_id is null then
    select s.id into new_id
    from public.workout_sessions s
    where s.owner_id = auth.uid() and s.client_id = cid;
    return new_id;
  end if;

  insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps, is_warmup, superset)
  select
    new_id,
    (s ->> 'exerciseId')::uuid,
    (s ->> 'exercisePosition')::smallint,
    (s ->> 'setIndex')::smallint,
    (s ->> 'kg')::numeric,
    (s ->> 'reps')::smallint,
    coalesce((s ->> 'isWarmup')::boolean, false),
    nullif(s ->> 'superset', '')
  from jsonb_array_elements(payload -> 'sets') as s;

  return new_id;
end;
$$;
