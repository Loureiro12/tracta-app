-- Apple refresh tokens are server-only: no client role can read or write them.
begin;
select plan(4);

select tests.create_user('alice') as alice \gset
insert into public.apple_tokens (user_id, refresh_token) values (:'alice', 'secret-token');

select tests.authenticate_as(:'alice');
select throws_ok(
  'select * from public.apple_tokens', '42501', null, 'the owner cannot read their own token'
);
select throws_ok(
  $$insert into public.apple_tokens (user_id, refresh_token) values (auth.uid(), 'x')$$,
  '42501', null, 'nor write one'
);
select tests.clear_authentication();
set local role anon;
select throws_ok('select * from public.apple_tokens', '42501', null, 'anonymous callers neither');

reset role;
delete from auth.users where id = :'alice';
select is((select count(*)::integer from public.apple_tokens), 0, 'the token goes with the account');

select * from finish();
rollback;
