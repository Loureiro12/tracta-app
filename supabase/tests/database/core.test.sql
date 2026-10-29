-- Core: signup bootstrap, owner-only access and immutable ownership of profiles/settings/goals.
begin;
select plan(16);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'user_settings', 'user_settings table exists');
select has_table('public', 'goals', 'goals table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'RLS on profiles');
select ok((select relrowsecurity from pg_class where oid = 'public.user_settings'::regclass), 'RLS on user_settings');
select ok((select relrowsecurity from pg_class where oid = 'public.goals'::regclass), 'RLS on goals');

-- Bootstrap: one auth user → one profile, one settings row, one goals row with defaults.
select tests.create_user('alice', 'alice') as alice \gset
select tests.create_user('bob', 'bob') as bob \gset

select is((select name from public.profiles where id = :'alice'), 'Alice', 'profile created with the signup name');
select is((select units::text from public.user_settings where user_id = :'alice'), 'kg', 'settings default to kg');
select is((select steps from public.goals where user_id = :'alice'), 10000, 'goals default to 10 000 steps');

-- As Alice: sees only her own rows.
select tests.authenticate_as(:'alice');
select is((select count(*)::int from public.profiles), 1, 'a user without friends sees only her profile');
select is((select count(*)::int from public.user_settings), 1, 'a user sees only her settings');
select is((select count(*)::int from public.goals where user_id = :'bob'), 0, 'a user cannot read someone else''s goals');

-- Updates are scoped: changing Bob's goals affects 0 rows, her own works.
update public.goals set steps = 12000 where user_id = :'bob';
update public.goals set steps = 8000 where user_id = :'alice';
select tests.clear_authentication();
select is((select steps from public.goals where user_id = :'bob'), 10000, 'cannot update another user''s goals');
select is((select steps from public.goals where user_id = :'alice'), 8000, 'can update own goals');

-- Constraints and privileges.
select tests.authenticate_as(:'alice');
select throws_ok(
  format('update public.goals set steps = 10 where user_id = %L', :'alice'),
  '23514', null, 'goal values are range-checked'
);
select throws_ok(
  format('insert into public.goals (user_id) values (%L)', :'alice'),
  '42501', null, 'goals rows are never inserted by clients'
);

select * from finish();
rollback;
