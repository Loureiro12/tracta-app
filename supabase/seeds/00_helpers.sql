-- =============================================================================
-- Local/CI only (seeds never run in production).
-- `seed`  : deterministic ids and lookups used by the demo data files.
-- `tests` : helpers for pgTAP tests (create users, act as a user).
-- =============================================================================

create extension if not exists pgtap with schema extensions;

create schema if not exists seed;
create schema if not exists tests;

-- Deterministic ids so E2E flows and fixtures can reference demo rows.
create or replace function seed.demo_user() returns uuid language sql immutable as
$$ select '00000000-0000-4000-8000-000000000001'::uuid $$;

-- Friends of the demo user: 'ana' → …0002, 'bruno' → …0003, 'carla' → …0004, 'diego' → …0005, 'elisa' → …0006
create or replace function seed.friend(p_key text) returns uuid language sql immutable as $$
  select case p_key
    when 'ana' then '00000000-0000-4000-8000-000000000002'
    when 'bruno' then '00000000-0000-4000-8000-000000000003'
    when 'carla' then '00000000-0000-4000-8000-000000000004'
    when 'diego' then '00000000-0000-4000-8000-000000000005'
    when 'elisa' then '00000000-0000-4000-8000-000000000006'
  end::uuid
$$;

-- Routine 'A' → 00000000-0000-4000-a000-000000000065 (ascii code of the letter)
create or replace function seed.demo_routine(p_label text) returns uuid language sql immutable as
$$ select ('00000000-0000-4000-a000-' || lpad(ascii(p_label)::text, 12, '0'))::uuid $$;

create or replace function seed.lib(p_slug text) returns uuid language sql stable as
$$ select id from public.exercises where owner_id is null and slug = p_slug $$;

-- Creates a confirmed e-mail/password user (profile, settings and goals come from the trigger).
create or replace function seed.create_user(p_id uuid, p_email text, p_password text, p_name text, p_handle text)
returns uuid
language plpgsql
as $$
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change, email_change_token_new
  ) values (
    '00000000-0000-0000-0000-000000000000', p_id, 'authenticated', 'authenticated', p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', jsonb_build_object('name', p_name), now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at, last_sign_in_at)
  values (gen_random_uuid(), p_id, p_id::text, jsonb_build_object('sub', p_id::text, 'email', p_email), 'email', now(), now(), now());
  update public.profiles set handle = p_handle where id = p_id;
  return p_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- pgTAP helpers
-- ---------------------------------------------------------------------------
-- tests.create_user('alice') → new auth user alice@test.local (random id)
create or replace function tests.create_user(p_key text, p_handle text default null)
returns uuid
language plpgsql
as $$
declare
  new_id uuid := gen_random_uuid();
begin
  perform seed.create_user(new_id, p_key || '@test.local', 'password123', initcap(p_key), p_handle);
  return new_id;
end;
$$;

-- Switch the current transaction to an authenticated user (RLS applies from here on).
create or replace function tests.authenticate_as(p_user uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', p_user::text, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function tests.authenticate_as_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
end;
$$;

-- Back to the superuser that runs the test file.
create or replace function tests.clear_authentication()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', null, true);
end;
$$;

grant usage on schema tests, seed to anon, authenticated;
grant execute on all functions in schema tests to anon, authenticated;
grant execute on all functions in schema seed to anon, authenticated;
