-- =============================================================================
-- Social read models and the atomic challenge creation (additive).
--   friends_today(day)        friends with that day's summary + streak, masked by share_*
--   suggested_friends()       friends of my friends I am not connected to (invite contacts)
--   create_challenge(...)     challenge + members in one call (members must be friends)
--   challenge_board(id, day)  per member × elapsed day: points and masked status (ranking)
-- "Today" always comes from the client (the app clock), never from current_date.
-- =============================================================================

-- Accepted friends of the caller with the given day's summary. A friend whose visibility is
-- 'me' still appears (they are a friend) but with every activity field null.
create or replace function public.friends_today(p_day date)
returns table (
  user_id uuid,
  name text,
  handle text,
  done boolean,
  active_minutes integer,
  steps integer,
  what text,
  at timestamptz,
  streak integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with f as (
    select case when fr.from_id = auth.uid() then fr.to_id else fr.from_id end as id
    from public.friend_requests fr
    where fr.status = 'accepted' and auth.uid() in (fr.from_id, fr.to_id)
  )
  select p.id, p.name, p.handle::text,
    case when vis.shown and st.share_done then coalesce(d.workouts, 0) > 0 end,
    case when vis.shown then coalesce(d.active_minutes, 0) end,
    case when vis.shown then coalesce(d.steps, 0) end,
    case when vis.shown and st.share_kind and d.workouts > 0 then d.what end,
    case when vis.shown and st.share_done and d.workouts > 0 then d.updated_at end,
    case when vis.shown and st.share_done and st.share_streak then (
      select count(*)::integer
      from (
        select s.day, row_number() over (order by s.day desc) as rn
        from public.daily_summaries s
        where s.user_id = p.id and s.workouts > 0
          and s.day <= p_day - (case when coalesce(d.workouts, 0) > 0 then 0 else 1 end)
      ) x
      where x.day = p_day - (case when coalesce(d.workouts, 0) > 0 then 0 else 1 end) - (x.rn - 1)::integer
    ) end
  from f
  join public.profiles p on p.id = f.id
  join public.user_settings st on st.user_id = f.id
  cross join lateral (select st.visibility <> 'me' as shown) vis
  left join public.daily_summaries d on d.user_id = f.id and d.day = p_day
  order by p.name;
$$;

-- People the caller may know: accepted friends of their friends, minus existing friends and
-- people who already invited the caller. `invited` marks a pending invite sent by the caller.
create or replace function public.suggested_friends()
returns table (user_id uuid, name text, handle text, invited boolean)
language sql
stable
security definer
set search_path = ''
as $$
  with mine as (
    select case when fr.from_id = auth.uid() then fr.to_id else fr.from_id end as id,
      fr.status, fr.from_id = auth.uid() as outgoing
    from public.friend_requests fr
    where auth.uid() in (fr.from_id, fr.to_id)
  ),
  fof as (
    select distinct case when fr.from_id = m.id then fr.to_id else fr.from_id end as id
    from mine m
    join public.friend_requests fr on fr.status = 'accepted' and m.id in (fr.from_id, fr.to_id)
    where m.status = 'accepted'
  )
  select p.id, p.name, p.handle::text,
    exists (select 1 from mine where mine.id = p.id and mine.status = 'pending' and mine.outgoing)
  from fof
  join public.profiles p on p.id = fof.id
  where auth.uid() is not null
    and p.id <> auth.uid()
    and not exists (
      select 1 from mine
      where mine.id = p.id and (mine.status = 'accepted' or not mine.outgoing)
    )
  order by p.name;
$$;

-- Creates a challenge owned by the caller and adds the given friends (the owner is added by
-- the on_challenge_created trigger; members get an invite notification).
create or replace function public.create_challenge(
  p_name text,
  p_kind public.challenge_kind,
  p_min_value integer,
  p_days integer,
  p_starts_on date,
  p_members uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_members), 0) = 0 then
    raise exception 'pick at least one friend' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(p_members) as m(id)
    where m.id = me or not public.are_friends(me, m.id)
  ) then
    raise exception 'members must be friends' using errcode = '42501';
  end if;

  insert into public.challenges (owner_id, name, kind, min_value, days, starts_on)
  values (me, btrim(p_name), p_kind, p_min_value, p_days, p_starts_on)
  returning id into new_id;

  insert into public.challenge_members (challenge_id, user_id)
  select distinct new_id, m.id from unnest(p_members) as m(id);

  return new_id;
end;
$$;

-- Ranking source: one row per member and elapsed day (starts_on .. min(end, p_today)).
-- Before the start there is one row per member with day = null. Members other than the caller
-- score only when they share completed workouts (share_done) and are not hidden (visibility
-- 'me'); `what` follows share_kind. Steps never leave the server: step challenges expose only
-- the point (goal reached yes/no), measured against each member's own step goal.
create or replace function public.challenge_board(p_challenge uuid, p_today date)
returns table (
  user_id uuid,
  name text,
  handle text,
  day date,
  points integer,
  done boolean,
  active_minutes integer,
  what text,
  at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_challenge_member(p_challenge, auth.uid()) then
    raise exception 'challenge not found' using errcode = 'P0002';
  end if;
  return query
  select m.user_id, p.name, p.handle::text, g.day,
    case
      when g.day is null or not vis.scores then 0
      when c.kind = 'day' then (coalesce(d.workouts, 0) > 0 and coalesce(d.active_minutes, 0) >= c.min_value)::integer
      when c.kind = 'minutes' then least(6, coalesce(d.active_minutes, 0) / 10)
      else (coalesce(d.steps, 0) >= coalesce(gl.steps, 10000))::integer
    end,
    case when g.day is not null and vis.scores then coalesce(d.workouts, 0) > 0 end,
    case when g.day is not null and (vis.self or st.visibility <> 'me') then coalesce(d.active_minutes, 0) end,
    case when vis.self or (st.visibility <> 'me' and st.share_kind) then d.what end,
    case when vis.scores and d.workouts > 0 then d.updated_at end
  from public.challenges c
  join public.challenge_members m on m.challenge_id = c.id
  join public.profiles p on p.id = m.user_id
  join public.user_settings st on st.user_id = m.user_id
  left join public.goals gl on gl.user_id = m.user_id
  cross join lateral (
    select m.user_id = auth.uid() as self,
      m.user_id = auth.uid() or (st.visibility <> 'me' and st.share_done) as scores
  ) vis
  left join lateral (
    select s::date as day
    from generate_series(c.starts_on, least(c.starts_on + c.days - 1, p_today), interval '1 day') s
  ) g on true
  left join public.daily_summaries d on d.user_id = m.user_id and d.day = g.day
  where c.id = p_challenge
  order by g.day nulls first, p.name;
end;
$$;

grant execute on function public.friends_today(date), public.suggested_friends(),
  public.create_challenge(text, public.challenge_kind, integer, integer, date, uuid[]),
  public.challenge_board(uuid, date) to authenticated;
revoke execute on function public.friends_today(date), public.suggested_friends(),
  public.create_challenge(text, public.challenge_kind, integer, integer, date, uuid[]),
  public.challenge_board(uuid, date) from anon, public;
