-- The E2E reset restores the demo account exactly; callable anonymously or by the demo user only.
begin;
select plan(9);

select tests.create_user('mallory') as mallory \gset

-- Someone else cannot reset the demo data.
select tests.authenticate_as(:'mallory');
select throws_ok('select public.e2e_reset_demo()', '42501', 'forbidden', 'only the demo user can reset');
select tests.clear_authentication();

-- Mutate the demo account the way flows do.
update public.profiles set name = 'Changed' where id = seed.demo_user();
update public.goals set steps = 20000 where user_id = seed.demo_user();
delete from public.routines where owner_id = seed.demo_user() and label = 'A';
insert into public.races (user_id, distance_m, race_date, target_seconds) values (seed.demo_user(), 10000, '2026-12-05', 3300);
update auth.users set encrypted_password = extensions.crypt('Other123', extensions.gen_salt('bf')) where id = seed.demo_user();

select tests.authenticate_as(seed.demo_user());
select lives_ok('select public.e2e_reset_demo()', 'the demo user can reset');
select tests.clear_authentication();

-- Before signing in (the password may have been changed by the previous flow).
update auth.users set encrypted_password = extensions.crypt('Other123', extensions.gen_salt('bf')) where id = seed.demo_user();
select tests.authenticate_as_anon();
select lives_ok('select public.e2e_reset_demo()', 'an anonymous caller can reset');
select tests.clear_authentication();

select is((select name from public.profiles where id = seed.demo_user()), 'Lucas Andrade', 'name restored');
select is((select steps from public.goals where user_id = seed.demo_user()), 10000, 'goals restored');
select is((select count(*)::int from public.routines where owner_id = seed.demo_user()), 3, 'routines A/B/C restored');
select is((select count(*)::int from public.races where user_id = seed.demo_user()), 0, 'race removed');
select ok(
  (select encrypted_password = extensions.crypt('Tracta2026', encrypted_password) from auth.users where id = seed.demo_user()),
  'password restored'
);
select is((select count(*)::int from public.profiles where id = :'mallory'), 1, 'other users are untouched');

select * from finish();
rollback;
