-- Google Health is accepted as a Health source on connections and synced days.
begin;
select plan(3);

select tests.create_user('alice') as alice \gset
select tests.authenticate_as(:'alice');

select lives_ok(
  $$insert into public.health_connections (source, read_types) values ('google_health', '{steps}')$$,
  'a connection can use google_health'
);
select lives_ok(
  $$select public.upsert_health_days('google_health', '[{"day": "2026-10-26", "steps": 5000}]'::jsonb)$$,
  'days can be synced from google_health'
);
select is((select source from public.health_days where day = '2026-10-26'), 'google_health', 'the day records its source');

select * from finish();
rollback;
