-- =============================================================================
-- Training: catalog order of the exercise library + save_routine RPC.
-- Additive only.
-- =============================================================================

-- Display order of the built-in library (custom exercises keep 0 and sort by creation).
alter table public.exercises add column position smallint not null default 0;

update public.exercises e
set position = o.ord
from unnest(array[
  'supino-reto-com-barra', 'supino-inclinado', 'crucifixo-na-maquina', 'flexao-de-braco',
  'puxada-frontal', 'remada-curvada', 'remada-baixa', 'barra-fixa',
  'desenvolvimento', 'elevacao-lateral', 'face-pull',
  'rosca-direta', 'rosca-martelo',
  'triceps-na-corda', 'triceps-frances', 'mergulho-nas-paralelas',
  'agachamento-livre', 'leg-press-45', 'cadeira-extensora', 'stiff', 'afundo', 'panturrilha-em-pe',
  'elevacao-pelvica', 'abducao-na-maquina',
  'abdominal-infra', 'abdominal-na-polia',
  'esteira', 'bicicleta-ergometrica', 'remo-ergometro',
  'mobilidade-de-quadril', 'mobilidade-toracica'
]) with ordinality as o(slug, ord)
where e.owner_id is null and e.slug = o.slug;

-- -----------------------------------------------------------------------------
-- save_routine: creates or updates a routine and replaces its exercises atomically.
-- payload = {
--   id?,            -- existing routine (must belong to the caller), omit to create
--   label?,         -- badge ("D"); on create defaults to the first free letter A..Z
--   name, focus?, weekday? (0 = Monday … 6 = Sunday, null = no fixed day),
--   exercises: [{ exerciseId, sets, reps, kg|null, restSeconds?, superset? }]   -- in order, ≥ 1
-- }
-- Runs as the caller (security invoker): RLS validates the routine owner and that every
-- exercise is visible to them (built-in or own custom).
-- -----------------------------------------------------------------------------
create or replace function public.save_routine(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  rid uuid := nullif(payload ->> 'id', '')::uuid;
  v_label text := nullif(btrim(payload ->> 'label'), '');
begin
  if uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if jsonb_typeof(payload -> 'exercises') is distinct from 'array'
     or jsonb_array_length(payload -> 'exercises') = 0 then
    raise exception 'a routine needs at least one exercise' using errcode = '22023';
  end if;

  if rid is null then
    if v_label is null then
      select l into v_label
      from unnest(string_to_array('A B C D E F G H I J K L M N O P Q R S T U V W X Y Z', ' ')) as l
      where not exists (select 1 from public.routines r where r.owner_id = uid and r.label = l)
      order by l
      limit 1;
      if v_label is null then
        raise exception 'no free routine label' using errcode = '23505';
      end if;
    end if;
    insert into public.routines (owner_id, label, name, focus, weekday, position)
    values (
      uid,
      v_label,
      btrim(payload ->> 'name'),
      coalesce(btrim(payload ->> 'focus'), ''),
      (payload ->> 'weekday')::smallint,
      coalesce((select max(r.position) + 1 from public.routines r where r.owner_id = uid), 0)
    )
    returning id into rid;
  else
    update public.routines
    set label = coalesce(v_label, label),
        name = btrim(payload ->> 'name'),
        focus = coalesce(btrim(payload ->> 'focus'), ''),
        weekday = (payload ->> 'weekday')::smallint
    where id = rid;
    if not found then
      raise exception 'routine not found' using errcode = 'P0002';
    end if;
    delete from public.routine_exercises where routine_id = rid;
  end if;

  insert into public.routine_exercises (routine_id, exercise_id, position, sets, reps, kg, rest_seconds, superset)
  select
    rid,
    (x.e ->> 'exerciseId')::uuid,
    (x.ord - 1)::smallint,
    (x.e ->> 'sets')::smallint,
    (x.e ->> 'reps')::smallint,
    (x.e ->> 'kg')::numeric,
    coalesce((x.e ->> 'restSeconds')::smallint, 90),
    nullif(x.e ->> 'superset', '')
  from jsonb_array_elements(payload -> 'exercises') with ordinality as x(e, ord);

  return rid;
end;
$$;

revoke execute on function public.save_routine(jsonb) from anon, public;
grant execute on function public.save_routine(jsonb) to authenticated;
