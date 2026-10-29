-- Social: friend requests, masked friend days, suggestions, cheers and challenges.
begin;
select plan(49);

select ok((select relrowsecurity from pg_class where oid = 'public.friend_requests'::regclass), 'RLS on friend_requests');
select ok((select relrowsecurity from pg_class where oid = 'public.daily_summaries'::regclass), 'RLS on daily_summaries');
select ok((select relrowsecurity from pg_class where oid = 'public.challenges'::regclass), 'RLS on challenges');
select ok((select relrowsecurity from pg_class where oid = 'public.challenge_members'::regclass), 'RLS on challenge_members');
select ok((select relrowsecurity from pg_class where oid = 'public.cheers'::regclass), 'RLS on cheers');

select tests.create_user('sam', 'sam_social') as sam \gset
select tests.create_user('fran', 'fran_social') as fran \gset
select tests.create_user('stan', 'stan_social') as stan \gset
select tests.create_user('fofi', 'fofi_social') as fofi \gset

-- ---------------------------------------------------------------------------
-- Friend requests
-- ---------------------------------------------------------------------------
select tests.authenticate_as(:'sam');
select is((select status::text from public.send_friend_request('@FRAN_social')), 'pending', 'invite by @handle (case-insensitive) is pending');
select is((select status::text from public.send_friend_request('fran_social')), 'pending', 'inviting twice returns the same request');
select throws_ok($$select public.send_friend_request('nobody_here')$$, 'P0002', null, 'unknown handle → not found');
select throws_ok($$select public.send_friend_request('sam_social')$$, '22023', null, 'cannot invite yourself');
select throws_ok(
  format('insert into public.friend_requests (from_id, to_id) values (%L, %L)', :'sam', :'stan'),
  '42501', null, 'requests are only created through send_friend_request'
);
select is((select count(*)::int from public.find_profile('@fran_social')), 1, 'find_profile resolves a handle');
select is((select count(*)::int from public.profiles where id = :'fran'), 1, 'the other side of a pending request is visible');

select tests.authenticate_as(:'stan');
select is((select count(*)::int from public.friend_requests), 0, 'a stranger sees no requests');
select is((select count(*)::int from public.profiles where id = :'sam'), 0, 'a stranger cannot read my profile');

-- Only the recipient accepts.
select tests.authenticate_as(:'sam');
update public.friend_requests set status = 'accepted' where to_id = :'fran';
select tests.clear_authentication();
select is((select status::text from public.friend_requests where from_id = :'sam' and to_id = :'fran'), 'pending', 'the sender cannot accept their own invite');

select tests.authenticate_as(:'fran');
update public.friend_requests set status = 'accepted', responded_at = now() where from_id = :'sam';
select ok(public.are_friends(:'sam', :'fran'), 'the recipient accepts');

-- Inviting back accepts a pending request (stan → sam, then sam → stan).
select tests.authenticate_as(:'stan');
select public.send_friend_request('sam_social');
select tests.authenticate_as(:'sam');
select is((select status::text from public.send_friend_request('stan_social')), 'accepted', 'inviting someone who invited me accepts');

-- Unfriend: either side deletes the row.
select tests.authenticate_as(:'stan');
delete from public.friend_requests where :'stan' in (from_id, to_id);
select ok(not public.are_friends(:'sam', :'stan'), 'either side can unfriend');

-- fran ↔ fofi friends (fofi becomes a suggestion for sam).
select tests.clear_authentication();
insert into public.friend_requests (from_id, to_id, status) values (:'fran', :'fofi', 'accepted');

-- ---------------------------------------------------------------------------
-- Daily summaries and friend days
-- ---------------------------------------------------------------------------
insert into public.daily_summaries (user_id, day, active_minutes, steps, workouts, what) values
  (:'sam', '2026-10-24', 40, 8000, 1, 'Treino A'),
  (:'sam', '2026-10-25', 30, 7000, 1, 'Corrida'),
  (:'sam', '2026-10-26', 52, 11000, 1, 'Treino B'),
  (:'stan', '2026-10-26', 10, 2000, 1, 'Caminhada');

select tests.authenticate_as(:'stan');
select is((select count(*)::int from public.daily_summaries where user_id = :'sam'), 0, 'a stranger cannot read my summaries');
select is((select count(*)::int from public.friend_days('2026-10-01', '2026-10-31') where user_id = :'sam'), 0, 'a stranger cannot see my days');
select is((select count(*)::int from public.friends_today('2026-10-26')), 0, 'a stranger is not in my friends list');

select tests.authenticate_as(:'fran');
select is((select count(*)::int from public.friend_days('2026-10-01', '2026-10-31') where user_id = :'sam'), 3, 'a friend sees my days');
select is((select what from public.friend_days('2026-10-26', '2026-10-26') where user_id = :'sam'), 'Treino B', 'share_kind on shows what');
select is((select streak from public.friends_today('2026-10-26') where user_id = :'sam'), 3, 'friends_today computes the streak');
select is((select done from public.friends_today('2026-10-26') where user_id = :'sam'), true, 'friends_today reports done');
select throws_ok(
  format('insert into public.daily_summaries (user_id, day) values (%L, %L)', :'sam', '2026-10-27'),
  '42501', null, 'nobody writes someone else''s summaries'
);

select tests.authenticate_as(:'sam');
update public.user_settings set share_kind = false, share_streak = false where user_id = :'sam';
select tests.authenticate_as(:'fran');
select is((select what from public.friend_days('2026-10-26', '2026-10-26') where user_id = :'sam'), null, 'share_kind=false hides what');
select is((select what from public.friends_today('2026-10-26') where user_id = :'sam'), null, 'share_kind=false hides what in friends_today');
select is((select streak from public.friends_today('2026-10-26') where user_id = :'sam'), null, 'share_streak=false hides the streak');

select tests.authenticate_as(:'sam');
update public.user_settings set share_done = false where user_id = :'sam';
select tests.authenticate_as(:'fran');
select is((select done from public.friend_days('2026-10-26', '2026-10-26') where user_id = :'sam'), null, 'share_done=false hides done');

select tests.authenticate_as(:'sam');
update public.user_settings set visibility = 'me', share_done = true, share_kind = true where user_id = :'sam';
select tests.authenticate_as(:'fran');
select is((select count(*)::int from public.friend_days('2026-10-01', '2026-10-31') where user_id = :'sam'), 0, 'visibility=me hides me entirely');
select is(
  (select row(done, active_minutes, what)::text from public.friends_today('2026-10-26') where user_id = :'sam'),
  '(,,)', 'visibility=me: still a friend, but no activity'
);
select tests.authenticate_as(:'sam');
update public.user_settings set visibility = 'friends' where user_id = :'sam';

-- Suggestions: friends of friends, flagged once invited.
select is((select array_agg(user_id) from public.suggested_friends()), array[:'fofi'::uuid], 'friends of friends are suggested');
select public.send_friend_request('fofi_social');
select is((select invited from public.suggested_friends() where user_id = :'fofi'), true, 'a suggestion I invited is flagged');

-- ---------------------------------------------------------------------------
-- Cheers
-- ---------------------------------------------------------------------------
insert into public.cheers (to_id, day) values (:'fran', '2026-10-26');
select is((select count(*)::int from public.cheers where to_id = :'fran'), 1, 'cheering a friend works');
select throws_ok(
  format('insert into public.cheers (to_id, day) values (%L, %L)', :'stan', '2026-10-26'),
  '42501', null, 'cheers only between friends'
);
select throws_ok(
  format('insert into public.cheers (to_id, day) values (%L, %L)', :'fran', '2026-10-26'),
  '23505', null, 'one cheer per friend per day'
);

-- ---------------------------------------------------------------------------
-- Challenges
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$select public.create_challenge('Duelo', 'day', 20, 7, '2026-10-26', array[%L]::uuid[])$$, :'stan'),
  '42501', null, 'challenges only include friends'
);
select throws_ok(
  $$select public.create_challenge('Duelo', 'day', 20, 7, '2026-10-26', array[]::uuid[])$$,
  '22023', null, 'a challenge needs at least one friend'
);
select throws_ok(
  format($$select public.create_challenge('Duelo', 'day', 20, 5, '2026-10-26', array[%L]::uuid[])$$, :'fran'),
  '23514', null, 'challenge length is 7, 14 or 30 days'
);
select public.create_challenge('Duelo', 'day', 30, 7, '2026-10-25', array[:'fran'::uuid]) as ch \gset
select is((select count(*)::int from public.challenge_members where challenge_id = :'ch'), 2, 'owner + invited friend are members');

-- fran (member, not owner) cannot add people; stan cannot see the challenge.
select tests.authenticate_as(:'fran');
select throws_ok(
  format('insert into public.challenge_members (challenge_id, user_id) values (%L, %L)', :'ch', :'fofi'),
  '42501', null, 'only the owner adds members'
);
select tests.authenticate_as(:'stan');
select is((select count(*)::int from public.challenges where id = :'ch'), 0, 'a non-member cannot see the challenge');
select throws_ok(format('select * from public.challenge_board(%L, %L)', :'ch', '2026-10-26'), 'P0002', null, 'a non-member cannot read the board');

-- Owner adds only friends.
select tests.authenticate_as(:'sam');
select throws_ok(
  format('insert into public.challenge_members (challenge_id, user_id) values (%L, %L)', :'ch', :'stan'),
  '42501', null, 'the owner cannot add strangers'
);

-- Board: sam (52 ≥ 30 on the 26th; 30 ≥ 30 on the 25th) has 2 points; fran has nothing.
select is(
  (select sum(points)::int from public.challenge_board(:'ch', '2026-10-26') where user_id = :'sam'), 2,
  'points per member over the elapsed days'
);
select is((select count(*)::int from public.challenge_board(:'ch', '2026-10-26')), 4, 'one row per member and elapsed day');
select is(
  (select count(*)::int from public.challenge_board(:'ch', '2026-10-20') where day is null), 2,
  'before the start: one row per member without day'
);

-- Leaving: fran deletes her own membership and loses access.
select tests.authenticate_as(:'fran');
delete from public.challenge_members where challenge_id = :'ch' and user_id = :'fran';
select is((select count(*)::int from public.challenges where id = :'ch'), 0, 'a member can leave');

select * from finish();
rollback;
