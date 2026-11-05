-- Workouts imported from Health: same tables as any workout, no duplicates, deleted ones stay out.
begin;
select plan(19);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select tests.authenticate_as(:'alice');

select throws_ok(
  $$select public.import_health_workouts('apple_health', '[]'::jsonb)$$,
  'P0002', 'health is not connected', 'importing needs a connection'
);
insert into public.health_connections (source, read_types) values ('apple_health', '{workouts}');

select is(
  public.import_health_workouts('apple_health', $$[
    {"id": "hk-bike", "kind": "bike", "started_at": "2026-10-20T06:00:00-03", "ended_at": "2026-10-20T07:00:00-03", "distance_m": 18400, "avg_heart_rate": 128},
    {"id": "hk-gym", "kind": "strength", "started_at": "2026-10-21T18:00:00-03", "ended_at": "2026-10-21T19:00:00-03"}
  ]$$::jsonb),
  2, 'adds both workouts'
);
select results_eq(
  $$select kind::text, duration_seconds, distance_m, avg_heart_rate::integer, external_id from public.activities$$,
  $$values ('bike', 3600, 18400, 128, 'hk-bike')$$,
  'an activity keeps what the source reported'
);
select results_eq(
  $$select title, external_source, external_id from public.workout_sessions$$,
  $$values ('Musculação', 'apple_health', 'hk-gym')$$,
  'a strength workout becomes a session'
);

-- It counts like any other workout.
select is(
  (select count(*)::integer from public.history_entries), 2, 'both show up in history'
);
select is(
  (select sets from public.history_entries where kind = 'strength'), 0, 'the session has no sets'
);
select is(
  (select count(*)::integer from public.daily_summaries where day in ('2026-10-20', '2026-10-21')),
  2, 'both feed the daily summaries that challenges read'
);

select is(
  public.import_health_workouts('apple_health', $$[{"id": "hk-bike", "kind": "bike", "started_at": "2026-10-20T06:00:00-03", "ended_at": "2026-10-20T07:00:00-03"}]$$::jsonb),
  0, 'importing the same workout again adds nothing'
);
select is(
  (select distance_m from public.activities where external_id = 'hk-bike'), 18400,
  'and leaves the saved one as it is'
);

-- The same workout recorded twice.
select lives_ok(
  $$select public.save_workout_session('{"title": "Treino A", "startedAt": "2026-10-22T18:00:00-03", "endedAt": "2026-10-22T19:00:00-03", "sets": []}'::jsonb)$$,
  'a session recorded in Tracta'
);
select is(
  public.import_health_workouts('apple_health', $$[{"id": "strava-a", "kind": "functional", "started_at": "2026-10-22T18:05:00-03", "ended_at": "2026-10-22T18:50:00-03"}]$$::jsonb),
  0, 'a workout overlapping most of an existing one is the same workout'
);
select is(
  public.import_health_workouts('apple_health', $$[{"id": "bike-b", "kind": "bike", "started_at": "2026-10-22T18:50:00-03", "ended_at": "2026-10-22T20:00:00-03"}]$$::jsonb),
  1, 'a short overlap is another workout'
);
select is(
  public.import_health_workouts('apple_health', $$[
    {"id": "watch", "kind": "run", "started_at": "2026-10-23T07:00:00-03", "ended_at": "2026-10-23T08:00:00-03"},
    {"id": "phone", "kind": "run", "started_at": "2026-10-23T07:01:00-03", "ended_at": "2026-10-23T07:59:00-03"}
  ]$$::jsonb),
  1, 'the same workout twice in one sync comes in once'
);

-- Deleted ones stay out.
delete from public.activities where external_id = 'hk-bike';
select is(
  public.import_health_workouts('apple_health', $$[{"id": "hk-bike", "kind": "bike", "started_at": "2026-10-20T06:00:00-03", "ended_at": "2026-10-20T07:00:00-03"}]$$::jsonb),
  0, 'a deleted import does not come back'
);
delete from public.workout_sessions where external_id = 'hk-gym';
select is(
  public.import_health_workouts('apple_health', $$[{"id": "hk-gym", "kind": "strength", "started_at": "2026-10-21T18:00:00-03", "ended_at": "2026-10-21T19:00:00-03"}]$$::jsonb),
  0, 'nor does a deleted imported session'
);
select throws_ok(
  $$insert into public.dismissed_imports (owner_id, external_source, external_id) values (auth.uid(), 'apple_health', 'x')$$,
  '42501', null, 'the list of deleted imports cannot be written directly'
);
select ok(
  (public.export_my_data() -> 'tables') ? 'dismissed_imports', 'the export includes that list'
);

-- Other users see none of it.
select tests.authenticate_as(:'bob');
select is((select count(*)::integer from public.dismissed_imports), 0, 'the list is private');

-- Deleting the account takes imported rows with it instead of failing on the list.
reset role;
select lives_ok(
  format('delete from auth.users where id = %L', :'alice'),
  'an account with imported workouts can be deleted'
);

select * from finish();
rollback;
