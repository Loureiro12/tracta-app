-- Progress photos (private bucket + metadata RLS), the personal data export and their demo reset.
begin;
select plan(30);

select tests.create_user('ana_photo') as ana \gset
select tests.create_user('bob_photo') as bob \gset

-- Bucket -----------------------------------------------------------------------------------
select is((select public from storage.buckets where id = 'progress-photos'), false, 'bucket is private');

-- Storage policies: own prefix only ---------------------------------------------------------
select tests.authenticate_as(:'ana');
select lives_ok(
  format('insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)', 'progress-photos', :'ana' || '/a.jpg', :'ana'),
  'owner uploads under her prefix'
);
select throws_ok(
  format('insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)', 'progress-photos', :'bob' || '/x.jpg', :'ana'),
  '42501', null, 'cannot upload under another user prefix'
);
select throws_ok(
  format('insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)', 'progress-photos', 'loose.jpg', :'ana'),
  '42501', null, 'cannot upload outside a user prefix'
);
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos'), 1, 'owner lists her objects');
select tests.clear_authentication();

select tests.authenticate_as(:'bob');
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos'), 0, 'stranger cannot read or list');
update storage.objects set name = :'bob' || '/stolen.jpg' where bucket_id = 'progress-photos' and name = :'ana' || '/a.jpg';
-- The Storage API deletes with this flag set; RLS must still filter the rows.
select set_config('storage.allow_delete_query', 'true', true);
delete from storage.objects where bucket_id = 'progress-photos';
select tests.clear_authentication();
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos' and name = :'ana' || '/a.jpg'), 1, 'stranger cannot move or delete');

select tests.authenticate_as_anon();
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos'), 0, 'anon cannot read');
select tests.clear_authentication();

select tests.authenticate_as(:'ana');
delete from storage.objects where bucket_id = 'progress-photos' and name = :'ana' || '/a.jpg';
select tests.clear_authentication();
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos' and name = :'ana' || '/a.jpg'), 0, 'owner deletes her object');
select set_config('storage.allow_delete_query', 'false', true);

-- progress_photos rows --------------------------------------------------------------------
select tests.authenticate_as(:'ana');
select lives_ok(
  format('insert into public.progress_photos (taken_on, weight_kg, storage_path) values (%L, 78.4, %L)', '2026-10-26', :'ana' || '/p1.jpg'),
  'owner inserts a photo row'
);
select is((select owner_id from public.progress_photos), :'ana'::uuid, 'owner defaults to the caller');
select throws_ok(
  format('insert into public.progress_photos (taken_on, storage_path) values (%L, %L)', '2026-10-26', :'bob' || '/p.jpg'),
  '23514', null, 'storage path must be under the owner prefix'
);
select throws_ok(
  format('insert into public.progress_photos (owner_id, taken_on, storage_path) values (%L, %L, %L)', :'bob', '2026-10-26', :'bob' || '/p.jpg'),
  '42501', null, 'cannot insert a row for another user'
);
select throws_ok(
  format('insert into public.progress_photos (taken_on, weight_kg, storage_path) values (%L, 5, %L)', '2026-10-26', :'ana' || '/p2.jpg'),
  '23514', null, 'weight must be plausible'
);
select throws_ok('update public.progress_photos set weight_kg = 70', '42501', null, 'rows are immutable');
select tests.clear_authentication();

select tests.authenticate_as(:'bob');
select is((select count(*)::int from public.progress_photos), 0, 'stranger cannot read photo rows');
delete from public.progress_photos;
select tests.clear_authentication();
select is((select count(*)::int from public.progress_photos where owner_id = :'ana'), 1, 'stranger cannot delete photo rows');

-- export_my_data --------------------------------------------------------------------------
insert into public.workout_sessions (id, owner_id, title, started_at, ended_at) values
  ('10000000-0000-4000-8000-0000000000e1', :'ana', 'Treino A', '2026-10-20 10:00Z', '2026-10-20 11:00Z'),
  ('10000000-0000-4000-8000-0000000000e2', :'bob', 'Treino B', '2026-10-20 10:00Z', '2026-10-20 11:00Z');
insert into public.session_sets (session_id, exercise_id, exercise_position, set_index, kg, reps) values
  ('10000000-0000-4000-8000-0000000000e1', seed.lib('supino-reto-com-barra'), 0, 0, 60, 8),
  ('10000000-0000-4000-8000-0000000000e1', seed.lib('supino-reto-com-barra'), 0, 1, 60, 6);
insert into public.body_measurements (owner_id, measured_on, weight_kg) values (:'bob', '2026-10-20', 90);
insert into public.friend_requests (from_id, to_id, status) values (:'bob', :'ana', 'pending');

select tests.authenticate_as_anon();
select throws_ok('select public.export_my_data()', '42501', null, 'anon cannot export');
select tests.clear_authentication();

select tests.authenticate_as(:'ana');
select public.export_my_data() as export \gset
select tests.clear_authentication();
select is((:'export'::jsonb) ->> 'user_id', :'ana', 'export is for the caller');
select is((:'export'::jsonb) -> 'profile' ->> 'name', 'Ana_photo', 'profile included');
select is(jsonb_array_length((:'export'::jsonb) -> 'tables' -> 'progress_photos'), 1, 'photo metadata included');
select ok(not ((:'export'::jsonb) -> 'tables' -> 'progress_photos' -> 0 ? 'owner_id'), 'owner column dropped from rows');
select is(jsonb_array_length((:'export'::jsonb) -> 'tables' -> 'workout_sessions'), 1, 'only own sessions');
select is(jsonb_array_length((:'export'::jsonb) -> 'tables' -> 'workout_sessions' -> 0 -> 'sets'), 2, 'sets nested in their session');
select is(jsonb_array_length((:'export'::jsonb) -> 'tables' -> 'body_measurements'), 0, 'no other user rows');
select is(jsonb_array_length((:'export'::jsonb) -> 'tables' -> 'friend_requests'), 1, 'incoming friend requests included');
select ok(
  ((:'export'::jsonb) -> 'tables') ?& array['user_settings', 'goals', 'routines', 'activities', 'challenges', 'notifications', 'cheers'],
  'settings, goals, routines, activities, social and inbox sections present'
);

-- Account deletion cascades the rows (the API removes the bytes first).
select tests.authenticate_as(:'ana');
select public.delete_account();
select tests.clear_authentication();
select is((select count(*)::int from public.progress_photos where owner_id = :'ana'), 0, 'photo rows cascade with the account');

-- Demo reset: uploaded photos (rows and objects) go away and the seeded frames come back.
insert into public.progress_photos (owner_id, taken_on, storage_path) values (seed.demo_user(), '2026-10-26', seed.demo_user() || '/new.jpg');
insert into storage.objects (bucket_id, name) values ('progress-photos', seed.demo_user() || '/new.jpg');
select seed.reset_demo();
select is((select count(*)::int from public.progress_photos where owner_id = seed.demo_user()), 5, 'demo photos restored');
select is((select count(*)::int from storage.objects where bucket_id = 'progress-photos' and name like seed.demo_user() || '/%'), 0, 'demo uploads removed');

select * from finish();
rollback;
