-- Inbox: notifications are written only by triggers; owners read, mark read and remove.
begin;
select plan(16);

select ok((select relrowsecurity from pg_class where oid = 'public.notifications'::regclass), 'RLS on notifications');

select tests.create_user('ina', 'ina_inbox') as ina \gset
select tests.create_user('otto', 'otto_inbox') as otto \gset
select tests.create_user('stra', 'stra_inbox') as stra \gset

-- Friend request → notification for the recipient.
select tests.authenticate_as(:'ina');
select public.send_friend_request('otto_inbox');
select tests.clear_authentication();
select is(
  (select title from public.notifications where owner_id = :'otto'),
  'Ina quer treinar com você', 'an invite notifies the recipient'
);
select is((select href from public.notifications where owner_id = :'otto'), '/social', 'the invite opens Social');

-- Accept → notification for the sender.
select tests.authenticate_as(:'otto');
update public.friend_requests set status = 'accepted', responded_at = now() where from_id = :'ina';
select tests.clear_authentication();
select is(
  (select title from public.notifications where owner_id = :'ina'),
  'Otto aceitou seu convite', 'accepting notifies the sender'
);

-- Cheer → notification for the friend.
select tests.authenticate_as(:'otto');
insert into public.cheers (to_id, day) values (:'ina', '2026-10-26');
select tests.clear_authentication();
select is(
  (select count(*)::int from public.notifications where owner_id = :'ina' and title = 'Otto torceu por você'),
  1, 'a cheer notifies the friend'
);

-- Challenge invite → notification for the member, not for the owner.
select tests.authenticate_as(:'ina');
select public.create_challenge('Outubro', 'minutes', 0, 14, '2026-10-26', array[:'otto'::uuid]);
select tests.clear_authentication();
select is(
  (select body from public.notifications where owner_id = :'otto' and title like '%Outubro%'),
  '14 dias', 'a challenge invite notifies the member'
);
select is(
  (select count(*)::int from public.notifications where owner_id = :'ina' and title like '%Outubro%'),
  0, 'the owner is not notified about their own challenge'
);

-- Clients never insert notifications.
select tests.authenticate_as(:'ina');
select throws_ok(
  format($$insert into public.notifications (owner_id, kind, title) values (%L, 'social', 'fake')$$, :'ina'),
  '42501', null, 'a user cannot insert notifications for themselves'
);
select throws_ok(
  format($$insert into public.notifications (owner_id, kind, title) values (%L, 'social', 'spam')$$, :'otto'),
  '42501', null, 'a user cannot insert notifications for others'
);
select throws_ok(
  $$update public.notifications set title = 'edited'$$,
  '42501', null, 'only read_at can change'
);

-- Owner isolation.
select is((select count(*)::int from public.notifications), 2, 'a user reads only their own notifications');
select tests.authenticate_as(:'stra');
select is((select count(*)::int from public.notifications), 0, 'a stranger reads nothing');
update public.notifications set read_at = now();
delete from public.notifications;
select tests.clear_authentication();
select is(
  (select count(*)::int from public.notifications where owner_id = :'ina' and read_at is null),
  2, 'a stranger cannot mark or remove someone else''s notifications'
);

-- Mark read / mark all read / remove.
select tests.authenticate_as(:'ina');
update public.notifications set read_at = now()
  where id = (select id from public.notifications order by created_at limit 1);
select is((select count(*)::int from public.notifications where read_at is null), 1, 'mark one as read');
update public.notifications set read_at = now() where read_at is null;
select is((select count(*)::int from public.notifications where read_at is null), 0, 'mark all as read');
delete from public.notifications where id = (select id from public.notifications limit 1);
select is((select count(*)::int from public.notifications), 1, 'the owner removes a notification');

select * from finish();
rollback;
