-- activities.route (20261030200000_activity_routes.sql): encoded polyline format, GPS-only,
-- owner-only visibility, and the demo runs' seeded tracks.
begin;
select plan(9);

select has_column('public', 'activities', 'route', 'activities.route exists');
select col_type_is('public', 'activities', 'route', 'text', 'route is an encoded polyline (text)');

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

select tests.authenticate_as(:'alice');
select lives_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds, distance_m, gps, route)
     values ('run', '2026-10-19 07:00-03', 1700, 5100, true, '_p~iF~ps|U_ulLnnqC_mqNvxq`@') $$,
  'a GPS run stores its route'
);
select throws_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds, gps, route)
     values ('yoga', now(), 600, false, '_p~iF~ps|U') $$,
  '23514', null, 'only GPS activities carry a route'
);
select throws_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds, gps, route)
     values ('run', now(), 600, true, 'not a polyline!') $$,
  '23514', null, 'the route must be a polyline string'
);
select throws_ok(
  $$ insert into public.activities (kind, started_at, duration_seconds, gps, route)
     values ('run', now(), 600, true, '') $$,
  '23514', null, 'an empty route is rejected (use null)'
);

select tests.authenticate_as(:'bob');
select is(
  (select count(*)::int from public.activities where route is not null), 0,
  'a stranger cannot read someone else''s route'
);
select tests.clear_authentication();

-- Seed encoder matches the reference polyline (same format as packages/api/src/polyline.ts).
select is(
  seed.polyline(array[[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]::float8[]),
  '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  'seed.polyline encodes like the app'
);
select ok(
  (select bool_and(route is not null) from public.activities
   where owner_id = seed.demo_user() and kind = 'run' and gps),
  'every demo GPS run has a route'
);

select * from finish();
rollback;
