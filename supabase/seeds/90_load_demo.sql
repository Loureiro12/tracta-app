-- =============================================================================
-- Loads every demo_* loader in name order, and defines the E2E reset.
-- Domain seed files add loaders named seed.demo_<NN>_<what>() returning void.
-- =============================================================================

create or replace function seed.load_demo()
returns void
language plpgsql
as $$
declare
  loader text;
begin
  for loader in
    select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'seed' and p.proname like 'demo\_%' and p.pronargs = 0
    order by p.proname
  loop
    execute format('select seed.%I()', loader);
  end loop;
  -- Loaders that touch friendships/cheers fire notification triggers; the inbox loader
  -- (if any) recreates the curated inbox afterwards, so drop trigger noise created above.
  delete from public.notifications n
  where n.owner_id in (select id from auth.users where email like '%@tracta.app')
    and n.created_at >= now() - interval '1 minute'
    and not exists (select 1 from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
                    where ns.nspname = 'seed' and p.proname like 'demo\_%inbox%');
end;
$$;

-- Wipes everything the demo account (and its demo friends) can change, then replays the loaders.
create or replace function seed.reset_demo()
returns void
language plpgsql
as $$
declare
  demo_ids uuid[] := array(select id from auth.users where email like '%@tracta.app');
begin
  delete from public.notifications where owner_id = any (demo_ids);
  delete from public.cheers where from_id = any (demo_ids) or to_id = any (demo_ids);
  delete from public.challenges where owner_id = any (demo_ids);
  delete from public.health_days where user_id = any (demo_ids);
  delete from public.health_connections where user_id = any (demo_ids);
  delete from public.daily_summaries where user_id = any (demo_ids);
  delete from public.friend_requests where from_id = any (demo_ids) or to_id = any (demo_ids);
  delete from public.email_invites where inviter_id = any (demo_ids);
  -- addresses the demo user invited by e-mail in flows (unconfirmed Auth users, never signed up)
  delete from auth.users
    where email_confirmed_at is null and raw_user_meta_data ->> 'invited_by' = any (demo_ids::text[]);
  delete from public.workout_sessions where owner_id = any (demo_ids);
  delete from public.activities where owner_id = any (demo_ids);
  delete from public.body_measurements where owner_id = any (demo_ids);
  delete from public.routines where owner_id = any (demo_ids);
  delete from public.exercise_prefs where user_id = any (demo_ids);
  delete from public.exercises where owner_id = any (demo_ids);
  delete from public.program_enrollments where user_id = any (demo_ids);
  delete from public.races where user_id = any (demo_ids);
  delete from public.subscriptions where user_id = any (demo_ids);
  delete from public.progress_photos where owner_id = any (demo_ids);
  -- Photos uploaded by the flows. Local/CI only: SQL deletes are normally refused by Storage
  -- (they orphan the file bytes); orphaned bytes of throwaway demo uploads are acceptable here.
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects
    where bucket_id = 'progress-photos' and split_part(name, '/', 1) = any (demo_ids::text[]);
  perform set_config('storage.allow_delete_query', 'false', true);

  -- Account fields the flows edit (name, e-mail, password, preferences, goals).
  update auth.users
    set encrypted_password = extensions.crypt('Tracta2026', extensions.gen_salt('bf')),
        email = split_part(email, '@', 1) || '@tracta.app'
    where id = any (demo_ids);
  update public.profiles p set name = u.raw_user_meta_data ->> 'name', handle = split_part(u.email, '@', 1)
    from auth.users u where u.id = p.id and p.id = any (demo_ids);
  delete from public.user_settings where user_id = any (demo_ids);
  insert into public.user_settings (user_id) select unnest(demo_ids);
  delete from public.goals where user_id = any (demo_ids);
  insert into public.goals (user_id) select unnest(demo_ids);

  perform seed.load_demo();
end;
$$;

-- Only exists where seeds ran (local/CI). Callable anonymously (it runs before signing in, so a
-- flow that changed the demo password cannot lock the next one out) or by the demo user;
-- any other signed-in user is refused.
create or replace function public.e2e_reset_demo()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() <> seed.demo_user() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform seed.reset_demo();
end;
$$;
revoke execute on function public.e2e_reset_demo() from public;
grant execute on function public.e2e_reset_demo() to anon, authenticated;

select seed.load_demo();
