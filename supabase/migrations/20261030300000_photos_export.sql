-- =============================================================================
-- Progress photos (private Storage bucket + metadata table) and the personal data export.
--
-- Storage layout: bucket `progress-photos` (private), objects at `<user_id>/<file>`. Storage
-- RLS lets each user read/write/delete only under their own prefix; the app shows photos via
-- short-lived signed URLs. Bytes are removed through the Storage API (packages/api photos and
-- account domains): Supabase forbids deleting storage.objects rows with SQL because the files
-- would be orphaned in the storage backend.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('progress-photos', 'progress-photos', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Own prefix only: the first path segment must be the caller's id.
create policy "progress-photos: owner reads" on storage.objects
  for select to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "progress-photos: owner uploads" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "progress-photos: owner updates" on storage.objects
  for update to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "progress-photos: owner deletes" on storage.objects
  for delete to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- -----------------------------------------------------------------------------
-- progress_photos: one row per uploaded picture (the bytes live in Storage).
-- -----------------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  taken_on date not null default current_date,
  -- Weight on the day of the photo (latest body measurement at upload time), if any.
  weight_kg numeric(5, 2) check (weight_kg is null or weight_kg between 20 and 400),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint progress_photos_own_prefix check (split_part(storage_path, '/', 1) = owner_id::text)
);

create index progress_photos_owner_taken_idx on public.progress_photos (owner_id, taken_on desc, created_at desc);

alter table public.progress_photos enable row level security;

create policy "progress_photos: owner" on public.progress_photos
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

revoke all on public.progress_photos from anon;
-- Rows are immutable once uploaded (delete and re-upload instead).
revoke update on public.progress_photos from authenticated;

-- -----------------------------------------------------------------------------
-- export_my_data(): everything the caller owns, as one JSON document.
--
-- Security invoker (RLS still applies) and every query is filtered by auth.uid(). Tables are
-- discovered by column: any public table with `owner_id` or `user_id` is exported under its
-- own name, so tables added later are included automatically. Child rows are nested in their
-- parent (session sets, routine exercises); two-sided relations (friend requests, cheers)
-- include both directions.
-- -----------------------------------------------------------------------------
create or replace function public.export_my_data()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  result jsonb;
  tables jsonb := '{}'::jsonb;
  rec record;
  rows jsonb;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Generic owned tables (owner_id preferred over user_id when both exist).
  for rec in
    select c.relname as table_name,
           (array_agg(a.attname::text order by case a.attname when 'owner_id' then 0 else 1 end))[1] as owner_column
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
      and a.attname in ('owner_id', 'user_id')
      and c.relname not in ('workout_sessions', 'routines', 'friend_requests', 'cheers')
      and has_table_privilege(c.oid, 'select')
    group by c.relname
    order by c.relname
  loop
    execute format(
      'select coalesce(jsonb_agg(to_jsonb(t) - %L), ''[]''::jsonb) from public.%I t where t.%I = $1',
      rec.owner_column, rec.table_name, rec.owner_column
    ) into rows using me;
    tables := tables || jsonb_build_object(rec.table_name, rows);
  end loop;

  -- Sessions with their sets, routines with their exercises.
  tables := tables || jsonb_build_object(
    'workout_sessions',
    coalesce((
      select jsonb_agg((to_jsonb(s) - 'owner_id') || jsonb_build_object('sets', coalesce((
        select jsonb_agg(to_jsonb(x) - 'session_id' order by x.exercise_position, x.set_index)
        from public.session_sets x where x.session_id = s.id), '[]'::jsonb)) order by s.started_at)
      from public.workout_sessions s where s.owner_id = me), '[]'::jsonb),
    'routines',
    coalesce((
      select jsonb_agg((to_jsonb(r) - 'owner_id') || jsonb_build_object('exercises', coalesce((
        select jsonb_agg(to_jsonb(x) - 'routine_id' order by x.position)
        from public.routine_exercises x where x.routine_id = r.id), '[]'::jsonb)) order by r.position)
      from public.routines r where r.owner_id = me), '[]'::jsonb),
    'friend_requests',
    coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at)
      from public.friend_requests f where me in (f.from_id, f.to_id)), '[]'::jsonb),
    'cheers',
    coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at)
      from public.cheers c where me in (c.from_id, c.to_id)), '[]'::jsonb)
  );

  select jsonb_build_object(
    'format', 'tracta-export',
    'version', 1,
    'exported_at', now(),
    'user_id', me,
    'email', auth.jwt() ->> 'email',
    'profile', (select to_jsonb(p) from public.profiles p where p.id = me),
    'tables', tables
  ) into result;
  return result;
end;
$$;

revoke execute on function public.export_my_data() from anon, public;
grant execute on function public.export_my_data() to authenticated;
