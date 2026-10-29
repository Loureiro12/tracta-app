/** Friends, requests, friend days feed, challenges and cheers. */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

export type ChallengeKind = Database['public']['Enums']['challenge_kind'];

/** Minimal public identity of another user. */
export type Person = { id: string; name: string; handle: string | null };

/** An accepted friend with their activity on the requested day (masked by their share_* switches). */
export type Friend = Person & {
  /** null when the friend hides completed workouts (share_done off) or everything (visibility 'me'). */
  done: boolean | null;
  activeMinutes: number | null;
  steps: number | null;
  /** Short description of the day's main activity; null unless shared (share_kind). */
  what: string | null;
  /** When the day's activity was last updated (ISO); null unless done is shared. */
  at: string | null;
  /** Consecutive days with a workout up to the day; null unless shared (share_streak). */
  streak: number | null;
};

export type FriendRequest = {
  id: string;
  person: Person;
  createdAt: string;
};

export type FriendRequests = { incoming: FriendRequest[]; outgoing: FriendRequest[] };

/** Someone the user may know (friend of a friend); `invited` once a request was sent. */
export type Suggestion = Person & { invited: boolean };

/** A friend's day from friend_days(), masked by the owner's sharing switches. */
export type FriendDay = {
  userId: string;
  name: string;
  day: string;
  done: boolean | null;
  activeMinutes: number;
  steps: number;
  what: string | null;
};

export type Challenge = {
  id: string;
  ownerId: string;
  name: string;
  kind: ChallengeKind;
  /** Minimum minutes per day for the `day` kind. */
  minValue: number;
  days: 7 | 14 | 30;
  /** First day (YYYY-MM-DD). */
  startsOn: string;
  memberCount: number;
  createdAt: string;
};

/** One member × one elapsed day of a challenge (day null before the start). */
export type BoardEntry = {
  userId: string;
  name: string;
  handle: string | null;
  day: string | null;
  points: number;
  done: boolean | null;
  activeMinutes: number | null;
  what: string | null;
  at: string | null;
};

const uuid = z.guid();
const dateKey = z.iso.date();

function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  return parsed.data;
}

async function requireUserId(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

/** Rows of a list response (an error throws the mapped ApiError). */
function rowsOf<T>(result: { data: T[] | null; error: unknown }): T[] {
  return unwrap(result) ?? [];
}

// ---------------------------------------------------------------------------
// Friends and requests
// ---------------------------------------------------------------------------

/** Accepted friends with their activity on `day` (the app's "today"). */
export async function listFriends(client: TractaClient, day: string): Promise<Friend[]> {
  await requireUserId(client);
  const rows = rowsOf(await client.rpc('friends_today', { p_day: parse(dateKey, day) }));
  return rows.map((r) => ({
    id: r.user_id,
    name: r.name,
    handle: r.handle,
    done: r.done as boolean | null,
    activeMinutes: r.active_minutes as number | null,
    steps: r.steps as number | null,
    what: r.what as string | null,
    at: r.at as string | null,
    streak: r.streak as number | null,
  }));
}

/** Pending requests: received (to accept/decline) and sent (waiting). */
export async function listRequests(client: TractaClient): Promise<FriendRequests> {
  const me = await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('friend_requests')
      .select('id, from_id, to_id, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  );
  const otherIds = rows.map((r) => (r.from_id === me ? r.to_id : r.from_id));
  const profiles = otherIds.length
    ? rowsOf(await client.from('profiles').select('id, name, handle').in('id', otherIds))
    : [];
  const byId = new Map(profiles.map((p) => [p.id, p]));
  const result: FriendRequests = { incoming: [], outgoing: [] };
  for (const r of rows) {
    const otherId = r.from_id === me ? r.to_id : r.from_id;
    const p = byId.get(otherId);
    const entry: FriendRequest = {
      id: r.id,
      person: { id: otherId, name: p?.name ?? '', handle: p?.handle ?? null },
      createdAt: r.created_at,
    };
    (r.from_id === me ? result.outgoing : result.incoming).push(entry);
  }
  return result;
}

/** Friends of friends the user is not connected to yet (invite contacts). */
export async function listSuggestions(client: TractaClient): Promise<Suggestion[]> {
  await requireUserId(client);
  const rows = rowsOf(await client.rpc('suggested_friends'));
  return rows.map((r) => ({ id: r.user_id, name: r.name, handle: r.handle, invited: r.invited }));
}

export const handleInput = z
  .string()
  .trim()
  .transform((h) => h.replace(/^@/, '').toLowerCase())
  .pipe(z.string().regex(/^[a-z0-9_.]{3,30}$/));

/** Looks a user up by @handle (null when nobody has it). */
export async function findByHandle(client: TractaClient, handle: string): Promise<Person | null> {
  await requireUserId(client);
  const rows = rowsOf(await client.rpc('find_profile', { p_handle: parse(handleInput, handle) }));
  const r = rows[0];
  return r ? { id: r.id, name: r.name, handle: r.handle } : null;
}

export type InviteResult = { requestId: string; status: 'pending' | 'accepted'; toId: string };

/**
 * Invites by @handle. Inviting someone who already invited me accepts their request.
 * Errors: validation (bad handle or self), not_found (unknown handle).
 */
export async function sendRequest(client: TractaClient, handle: string): Promise<InviteResult> {
  const me = await requireUserId(client);
  const row = unwrapOne(
    await client.rpc('send_friend_request', { p_handle: parse(handleInput, handle) }),
    'request',
  );
  return {
    requestId: row.id,
    status: row.status,
    toId: row.from_id === me ? row.to_id : row.from_id,
  };
}

/** Accepts a received request (only the recipient can). */
export async function acceptRequest(client: TractaClient, requestId: string): Promise<void> {
  const me = await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('friend_requests')
      .update({ status: 'accepted', responded_at: new Date().toISOString() })
      .eq('id', parse(uuid, requestId))
      .eq('to_id', me)
      .eq('status', 'pending')
      .select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'request not found');
}

/** Declines a received request or cancels a sent one. */
export async function removeRequest(client: TractaClient, requestId: string): Promise<void> {
  await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('friend_requests')
      .delete()
      .eq('id', parse(uuid, requestId))
      .eq('status', 'pending')
      .select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'request not found');
}

/** Ends a friendship (either side). */
export async function unfriend(client: TractaClient, friendId: string): Promise<void> {
  const me = await requireUserId(client);
  const other = parse(uuid, friendId);
  const rows = rowsOf(
    await client
      .from('friend_requests')
      .delete()
      .eq('status', 'accepted')
      .or(`and(from_id.eq.${me},to_id.eq.${other}),and(from_id.eq.${other},to_id.eq.${me})`)
      .select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'friend not found');
}

/** Friends' days in a date range (inclusive), masked by each friend's switches. */
export async function friendDays(
  client: TractaClient,
  from: string,
  to: string,
): Promise<FriendDay[]> {
  await requireUserId(client);
  const rows = rowsOf(
    await client.rpc('friend_days', { p_from: parse(dateKey, from), p_to: parse(dateKey, to) }),
  );
  return rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    day: r.day,
    done: r.done as boolean | null,
    activeMinutes: r.active_minutes,
    steps: r.steps,
    what: r.what as string | null,
  }));
}

// ---------------------------------------------------------------------------
// Cheers
// ---------------------------------------------------------------------------

/** Ids of the friends the user cheered on `day`. */
export async function listCheers(client: TractaClient, day: string): Promise<string[]> {
  const me = await requireUserId(client);
  const rows = rowsOf(
    await client.from('cheers').select('to_id').eq('from_id', me).eq('day', parse(dateKey, day)),
  );
  return rows.map((r) => r.to_id);
}

/** Cheers a friend's day (forbidden for non-friends; conflict when already cheered). */
export async function cheer(client: TractaClient, friendId: string, day: string): Promise<void> {
  await requireUserId(client);
  unwrap(
    await client.from('cheers').insert({ to_id: parse(uuid, friendId), day: parse(dateKey, day) }),
  );
}

export async function uncheer(client: TractaClient, friendId: string, day: string): Promise<void> {
  const me = await requireUserId(client);
  unwrap(
    await client
      .from('cheers')
      .delete()
      .eq('from_id', me)
      .eq('to_id', parse(uuid, friendId))
      .eq('day', parse(dateKey, day)),
  );
}

// ---------------------------------------------------------------------------
// Challenges
// ---------------------------------------------------------------------------

type ChallengeRow = Database['public']['Tables']['challenges']['Row'] & {
  challenge_members: { count: number }[];
};

function toChallenge(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    kind: r.kind,
    minValue: r.min_value,
    days: r.days as Challenge['days'],
    startsOn: r.starts_on,
    memberCount: r.challenge_members[0]?.count ?? 0,
    createdAt: r.created_at,
  };
}

/** Challenges the user takes part in, newest first. */
export async function listChallenges(client: TractaClient): Promise<Challenge[]> {
  await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('challenges')
      .select('*, challenge_members(count)')
      .order('starts_on', { ascending: false })
      .order('created_at', { ascending: false }),
  );
  return (rows as ChallengeRow[]).map(toChallenge);
}

export const challengeInput = z.object({
  name: z.string().trim().min(1).max(40),
  kind: z.enum(['day', 'minutes', 'steps']),
  minValue: z.number().int().min(0).max(100000).default(20),
  days: z.union([z.literal(7), z.literal(14), z.literal(30)]),
  startsOn: dateKey,
  memberIds: z.array(uuid).min(1),
});

/** Creates a challenge with friends in one call; returns its id. Strangers → forbidden. */
export async function createChallenge(
  client: TractaClient,
  input: z.input<typeof challengeInput>,
): Promise<string> {
  await requireUserId(client);
  const c = parse(challengeInput, input);
  return unwrapOne(
    await client.rpc('create_challenge', {
      p_name: c.name,
      p_kind: c.kind,
      p_min_value: c.minValue,
      p_days: c.days,
      p_starts_on: c.startsOn,
      p_members: c.memberIds,
    }),
    'challenge',
  );
}

/** Adds friends to a challenge (owner only; members must be friends of the owner). */
export async function addMembers(
  client: TractaClient,
  challengeId: string,
  memberIds: string[],
): Promise<void> {
  await requireUserId(client);
  const id = parse(uuid, challengeId);
  const members = parse(z.array(uuid).min(1), memberIds);
  unwrap(
    await client
      .from('challenge_members')
      .insert(members.map((user_id) => ({ challenge_id: id, user_id }))),
  );
}

/** Leaves a challenge. When the owner leaves, the challenge ends for everyone (deleted). */
export async function leaveChallenge(client: TractaClient, challengeId: string): Promise<void> {
  const me = await requireUserId(client);
  const id = parse(uuid, challengeId);
  const owned = rowsOf(
    await client.from('challenges').delete().eq('id', id).eq('owner_id', me).select('id'),
  );
  if (owned.length > 0) return;
  const rows = rowsOf(
    await client
      .from('challenge_members')
      .delete()
      .eq('challenge_id', id)
      .eq('user_id', me)
      .select('challenge_id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'challenge not found');
}

export type ChallengeBoard = { challenge: Challenge; entries: BoardEntry[] };

/** Challenge + per member/day points up to `today` (not_found for non-members). */
export async function getChallengeBoard(
  client: TractaClient,
  challengeId: string,
  today: string,
): Promise<ChallengeBoard> {
  await requireUserId(client);
  const id = parse(uuid, challengeId);
  const [challenge, board] = await Promise.all([
    client.from('challenges').select('*, challenge_members(count)').eq('id', id).maybeSingle(),
    client.rpc('challenge_board', { p_challenge: id, p_today: parse(dateKey, today) }),
  ]);
  const row = unwrap(challenge) as ChallengeRow | null;
  if (!row) throw new ApiError('not_found', 'challenge not found');
  return {
    challenge: toChallenge(row),
    entries: rowsOf(board).map((r) => ({
      userId: r.user_id,
      name: r.name,
      handle: r.handle,
      day: r.day as string | null,
      points: r.points,
      done: r.done as boolean | null,
      activeMinutes: r.active_minutes as number | null,
      what: r.what as string | null,
      at: r.at as string | null,
    })),
  };
}
