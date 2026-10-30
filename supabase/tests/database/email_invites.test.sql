-- E-mail invites: RLS, create_email_invite (dedupe, limit, existing accounts), revoke, sign-up link.
begin;
select plan(28);

select ok((select relrowsecurity from pg_class where oid = 'public.email_invites'::regclass), 'RLS on email_invites');

select tests.create_user('ivy', 'ivy_invites') as ivy \gset
select tests.create_user('olaf', 'olaf_invites') as olaf \gset
select tests.create_user('exa', 'exa_invites') as exa \gset

-- Only the service role records invites.
select tests.authenticate_as(:'ivy');
select throws_ok(
  format('select * from public.create_email_invite(%L, %L)', :'ivy', 'nova@example.com'),
  '42501', null, 'clients cannot call create_email_invite'
);
select throws_ok(
  format('insert into public.email_invites (inviter_id, email) values (%L, %L)', :'ivy', 'nova@example.com'),
  '42501', null, 'clients cannot insert invites'
);
select tests.clear_authentication();

-- New address: recorded as pending and the e-mail must be sent.
select is((select send from public.create_email_invite(:'ivy', ' Nova@Example.com ')), true, 'a new address is sent');
select is(
  (select status::text from public.email_invites where inviter_id = :'ivy' and email = 'nova@example.com'),
  'pending', 'the invite is pending (address normalized)'
);
select is((select send from public.create_email_invite(:'ivy', 'NOVA@example.com')), false, 'inviting twice does not resend');
select is((select count(*)::int from public.email_invites where inviter_id = :'ivy'), 1, 'one row per inviter and address');
select throws_ok(
  format('select * from public.create_email_invite(%L, %L)', :'ivy', 'not-an-email'),
  '22023', null, 'invalid e-mail'
);
select throws_ok(
  format('select * from public.create_email_invite(%L, %L)', :'ivy', 'ivy@test.local'),
  '22023', null, 'cannot invite yourself'
);

-- Existing account: a friend request instead of an e-mail, no matter the case.
select is((select send from public.create_email_invite(:'ivy', 'EXA@test.local')), false, 'an existing account gets no e-mail');
select is(
  (select status::text from public.friend_requests where from_id = :'ivy' and to_id = :'exa'),
  'pending', 'an existing account gets a friend request'
);
select is(
  (select count(*)::int from public.notifications where owner_id = :'exa' and kind = 'social'),
  1, 'the existing account is notified'
);

-- RLS: the inviter reads own invites only, and cannot edit them directly.
select id as nova_invite from public.email_invites where inviter_id = :'ivy' and email = 'nova@example.com' \gset
select tests.authenticate_as(:'ivy');
select is((select count(*)::int from public.email_invites), 2, 'the inviter reads own invites');
select throws_ok(
  $$update public.email_invites set status = 'accepted' where email = 'nova@example.com'$$,
  '42501', null, 'clients cannot update invites directly'
);
select tests.authenticate_as(:'olaf');
select is((select count(*)::int from public.email_invites), 0, 'others see no invites');
select throws_ok(
  format('select public.revoke_email_invite(%L)', :'nova_invite'),
  'P0002', null, 'others cannot revoke'
);
select tests.clear_authentication();
select is(
  (select status::text from public.email_invites where inviter_id = :'ivy' and email = 'nova@example.com'),
  'pending', 'the invite is unchanged'
);

-- olaf also invites nova; nova signs up → both invites accepted, both requests pending.
select is((select send from public.create_email_invite(:'olaf', 'nova@example.com')), true, 'another inviter may invite the same address');
select tests.create_user('nova') as nova \gset
-- tests.create_user uses <key>@test.local; move the address to the invited one and confirm it
update auth.users set email = 'nova@example.com', email_confirmed_at = null where id = :'nova';
update auth.users set email_confirmed_at = now() where id = :'nova';
select is(
  (select count(*)::int from public.email_invites where email = 'nova@example.com' and status = 'accepted' and accepted_by = :'nova'),
  2, 'confirming the invited address accepts every pending invite'
);
select is(
  (select count(*)::int from public.friend_requests where to_id = :'nova' and status = 'pending' and from_id in (:'ivy', :'olaf')),
  2, 'each inviter''s friend request reaches the new user'
);

-- Revoke: a pending invite becomes expired; coming back within a day does not resend.
select public.create_email_invite(:'ivy', 'later@example.com');
select tests.authenticate_as(:'ivy');
select lives_ok(
  format('select public.revoke_email_invite(%L)', (select id from public.email_invites where email = 'later@example.com')),
  'the inviter revokes a pending invite'
);
select tests.clear_authentication();
select is((select status::text from public.email_invites where email = 'later@example.com'), 'expired', 'revoked invites are expired');
select is((select send from public.create_email_invite(:'ivy', 'later@example.com')), false, 'no second e-mail within a day');
select is((select status::text from public.email_invites where email = 'later@example.com'), 'pending', 'the invite is pending again');

-- Daily limit (20 e-mails per inviter).
select public.create_email_invite(:'olaf', 'bulk' || n || '@example.com') from generate_series(1, 19) n;
select throws_ok(
  format('select * from public.create_email_invite(%L, %L)', :'olaf', 'one-too-many@example.com'),
  '53400', null, 'the daily limit is enforced'
);

-- E2E reset: the demo user's invites go back to the seeded one; invited ghosts are removed.
select public.create_email_invite(seed.demo_user(), 'flow@example.com');
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, invited_at)
values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'flow@example.com', jsonb_build_object('invited_by', seed.demo_user()), now());
select is((select count(*)::int from public.email_invites where inviter_id = seed.demo_user()), 2, 'the demo user sent an invite');
select seed.reset_demo();
select is(
  (select array_agg(email::text) from public.email_invites where inviter_id = seed.demo_user()),
  array['marina@example.com'], 'reset restores the seeded demo invite'
);
select is((select count(*)::int from auth.users where email = 'flow@example.com'), 0, 'reset removes users invited by the demo account');

select * from finish();
rollback;
