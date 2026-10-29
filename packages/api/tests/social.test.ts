import { describe, expect, it } from 'vitest';

import { account, social } from '../src';
import { adminClient, anonClient, befriend, createTestUser, uniqueHandle } from './helpers';

import type { TestUser } from './helpers';

const DAY = '2026-10-26';

async function withHandle(name: string): Promise<TestUser & { handle: string }> {
  const handle = uniqueHandle(name.toLowerCase().slice(0, 3));
  return { ...(await createTestUser(name, { handle })), handle };
}

async function logDay(
  user: TestUser,
  day: string,
  row: { active_minutes: number; steps?: number; workouts: number; what?: string },
) {
  const { error } = await user.client.from('daily_summaries').insert({ day, ...row });
  if (error) throw error;
}

async function notificationsOf(userId: string) {
  const { data } = await adminClient()
    .from('notifications')
    .select('title, body, href')
    .eq('owner_id', userId);
  return data ?? [];
}

describe('social · friends and requests', () => {
  it('requires a session', async () => {
    await expect(social.listFriends(anonClient(), DAY)).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('invites by @handle, the recipient accepts, and both become friends', async () => {
    const a = await withHandle('Alice');
    const b = await withHandle('Bruno');

    const sent = await social.sendRequest(a.client, `@${b.handle.toUpperCase()}`);
    expect(sent).toMatchObject({ status: 'pending', toId: b.id });

    const aSide = await social.listRequests(a.client);
    expect(aSide.outgoing.map((r) => r.person)).toEqual([
      { id: b.id, name: 'Bruno', handle: b.handle },
    ]);
    const bSide = await social.listRequests(b.client);
    expect(bSide.incoming).toHaveLength(1);
    expect(bSide.incoming[0]?.person.name).toBe('Alice');

    // The sender cannot accept their own invite.
    await expect(social.acceptRequest(a.client, sent.requestId)).rejects.toMatchObject({
      code: 'not_found',
    });
    await social.acceptRequest(b.client, sent.requestId);

    expect((await social.listFriends(a.client, DAY)).map((f) => f.id)).toEqual([b.id]);
    expect((await social.listFriends(b.client, DAY)).map((f) => f.id)).toEqual([a.id]);
    expect(await social.listRequests(a.client)).toEqual({ incoming: [], outgoing: [] });
  });

  it('inviting someone who already invited me accepts their request', async () => {
    const a = await withHandle('Ana');
    const b = await withHandle('Bia');
    await social.sendRequest(a.client, b.handle);
    const back = await social.sendRequest(b.client, a.handle);
    expect(back.status).toBe('accepted');
  });

  it('maps invite errors: bad handle, unknown handle, myself', async () => {
    const a = await withHandle('Solo');
    await expect(social.sendRequest(a.client, 'no spaces')).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(social.sendRequest(a.client, uniqueHandle('ghost'))).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(social.sendRequest(a.client, a.handle)).rejects.toMatchObject({
      code: 'validation',
    });
    expect(await social.findByHandle(a.client, uniqueHandle('ghost'))).toBeNull();
  });

  it('declines, cancels and unfriends', async () => {
    const a = await withHandle('Dec');
    const b = await withHandle('Ded');
    const c = await createTestUser('Friend C');

    const req = await social.sendRequest(a.client, b.handle);
    await social.removeRequest(b.client, req.requestId); // decline
    expect((await social.listRequests(a.client)).outgoing).toEqual([]);

    const again = await social.sendRequest(a.client, b.handle);
    await social.removeRequest(a.client, again.requestId); // cancel
    expect((await social.listRequests(b.client)).incoming).toEqual([]);

    await befriend(a, c);
    await expect(social.unfriend(b.client, c.id)).rejects.toMatchObject({ code: 'not_found' });
    await social.unfriend(c.client, a.id);
    expect(await social.listFriends(a.client, DAY)).toEqual([]);
    await expect(social.unfriend(a.client, 'not-a-uuid')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('suggests friends of friends and flags the ones already invited', async () => {
    const me = await createTestUser('Me');
    const friend = await createTestUser('Friend');
    const fof = await withHandle('Fof');
    await befriend(me, friend);
    await befriend(friend, fof);

    expect(await social.listSuggestions(me.client)).toEqual([
      { id: fof.id, name: 'Fof', handle: fof.handle, invited: false },
    ]);
    await social.sendRequest(me.client, fof.handle);
    expect((await social.listSuggestions(me.client))[0]?.invited).toBe(true);
    // The other side does not get me suggested back while my invite is pending.
    expect((await social.listSuggestions(fof.client)).map((s) => s.id)).not.toContain(me.id);
  });
});

describe('social · friend days and privacy switches', () => {
  it('a stranger cannot see my days; a friend sees them masked by my switches', async () => {
    const me = await createTestUser('Sharer');
    const friend = await createTestUser('Viewer');
    const stranger = await createTestUser('Stranger');
    await befriend(me, friend);
    await logDay(me, '2026-10-25', { active_minutes: 30, workouts: 1, what: 'Corrida' });
    await logDay(me, DAY, { active_minutes: 52, steps: 11200, workouts: 1, what: 'Treino A' });

    expect(await social.friendDays(stranger.client, '2026-10-01', '2026-10-31')).toEqual([]);
    const { data } = await stranger.client.from('daily_summaries').select('*').eq('user_id', me.id);
    expect(data).toEqual([]);

    const days = await social.friendDays(friend.client, '2026-10-01', '2026-10-31');
    expect(days).toHaveLength(2);
    const [today] = await social.listFriends(friend.client, DAY);
    expect(today).toMatchObject({
      id: me.id,
      done: true,
      activeMinutes: 52,
      steps: 11200,
      what: 'Treino A',
      streak: 2,
    });
    expect(today?.at).toEqual(expect.any(String));

    await account.updateSettings(me.client, { share: { kind: false, streak: false } });
    const [hidden] = await social.listFriends(friend.client, DAY);
    expect(hidden).toMatchObject({ done: true, what: null, streak: null });
    expect((await social.friendDays(friend.client, DAY, DAY)).map((d) => d.what)).toEqual([null]);

    await account.updateSettings(me.client, { share: { done: false } });
    expect((await social.listFriends(friend.client, DAY))[0]?.done).toBeNull();

    await account.updateSettings(me.client, { visibility: 'me', share: { done: true } });
    expect(await social.friendDays(friend.client, '2026-10-01', '2026-10-31')).toEqual([]);
    expect((await social.listFriends(friend.client, DAY))[0]).toMatchObject({
      id: me.id,
      done: null,
      activeMinutes: null,
      steps: null,
    });
  });

  it('validates date inputs', async () => {
    const me = await createTestUser('Dates');
    await expect(social.listFriends(me.client, '26/10/2026')).rejects.toMatchObject({
      code: 'validation',
    });
  });
});

describe('social · cheers', () => {
  it('cheers only between friends, once per day, and notifies the friend', async () => {
    const me = await createTestUser('Cheerer');
    const friend = await createTestUser('Cheered');
    const stranger = await createTestUser('Nobody');
    await befriend(me, friend);

    await social.cheer(me.client, friend.id, DAY);
    expect(await social.listCheers(me.client, DAY)).toEqual([friend.id]);
    await expect(social.cheer(me.client, friend.id, DAY)).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(social.cheer(me.client, stranger.id, DAY)).rejects.toMatchObject({
      code: 'forbidden',
    });
    expect(await notificationsOf(friend.id)).toContainEqual(
      expect.objectContaining({ title: 'Cheerer torceu por você', href: '/social' }),
    );

    await social.uncheer(me.client, friend.id, DAY);
    expect(await social.listCheers(me.client, DAY)).toEqual([]);
  });
});

describe('social · challenges', () => {
  it('creates a challenge with friends only, notifies them and computes the board', async () => {
    const owner = await createTestUser('Owner');
    const friend = await createTestUser('Member');
    const stranger = await createTestUser('Outsider');
    await befriend(owner, friend);

    await expect(
      social.createChallenge(owner.client, {
        name: 'Duelo',
        kind: 'day',
        days: 7,
        startsOn: DAY,
        memberIds: [stranger.id],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    await expect(
      social.createChallenge(owner.client, {
        name: 'Duelo',
        kind: 'day',
        days: 7,
        startsOn: DAY,
        memberIds: [],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      social.createChallenge(owner.client, {
        name: ' ',
        kind: 'day',
        days: 7,
        startsOn: DAY,
        memberIds: [friend.id],
      }),
    ).rejects.toMatchObject({ code: 'validation' });

    const id = await social.createChallenge(owner.client, {
      name: 'Semana em movimento',
      kind: 'day',
      minValue: 20,
      days: 7,
      startsOn: '2026-10-25',
      memberIds: [friend.id],
    });
    expect(await notificationsOf(friend.id)).toContainEqual(
      expect.objectContaining({ title: 'Owner convidou você para "Semana em movimento"' }),
    );

    const [listed] = await social.listChallenges(friend.client);
    expect(listed).toMatchObject({ id, name: 'Semana em movimento', days: 7, memberCount: 2 });

    await logDay(owner, '2026-10-25', { active_minutes: 25, workouts: 1 });
    await logDay(owner, DAY, { active_minutes: 52, workouts: 1, what: 'Treino A' });
    await logDay(friend, DAY, { active_minutes: 15, workouts: 1 });

    const board = await social.getChallengeBoard(friend.client, id, DAY);
    expect(board.challenge.startsOn).toBe('2026-10-25');
    const total = (userId: string) =>
      board.entries.filter((e) => e.userId === userId).reduce((s, e) => s + e.points, 0);
    expect(total(owner.id)).toBe(2);
    expect(total(friend.id)).toBe(0); // 15 min is below the 20 min minimum
    expect(board.entries.find((e) => e.userId === owner.id && e.day === DAY)).toMatchObject({
      done: true,
      activeMinutes: 52,
      what: 'Treino A',
    });

    // Before the start: one row per member without a day.
    const early = await social.getChallengeBoard(owner.client, id, '2026-10-20');
    expect(early.entries.map((e) => e.day)).toEqual([null, null]);

    // A stranger can neither read the board nor see the challenge.
    await expect(social.getChallengeBoard(stranger.client, id, DAY)).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(await social.listChallenges(stranger.client)).toEqual([]);

    // Any Postgres uuid is accepted, not only RFC variants (seeded ids use a "c" variant nibble).
    await expect(
      social.getChallengeBoard(owner.client, '00000000-0000-4000-c000-000000000999', DAY),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('hides scores of members who do not share completed workouts', async () => {
    const owner = await createTestUser('Owner2');
    const shy = await createTestUser('Shy');
    await befriend(owner, shy);
    const id = await social.createChallenge(owner.client, {
      name: 'Minutos',
      kind: 'minutes',
      days: 14,
      startsOn: DAY,
      memberIds: [shy.id],
    });
    await logDay(shy, DAY, { active_minutes: 45, workouts: 1, what: 'Yoga' });
    expect(
      (await social.getChallengeBoard(owner.client, id, DAY)).entries.find(
        (e) => e.userId === shy.id,
      ),
    ).toMatchObject({ points: 4, done: true, what: 'Yoga' });

    await account.updateSettings(shy.client, { share: { done: false, kind: false } });
    expect(
      (await social.getChallengeBoard(owner.client, id, DAY)).entries.find(
        (e) => e.userId === shy.id,
      ),
    ).toMatchObject({ points: 0, done: null, what: null });
    // The member still sees their own score.
    expect(
      (await social.getChallengeBoard(shy.client, id, DAY)).entries.find(
        (e) => e.userId === shy.id,
      ),
    ).toMatchObject({ points: 4, done: true, what: 'Yoga' });
  });

  it('only the owner adds members, and only friends', async () => {
    const owner = await createTestUser('Boss');
    const member = await createTestUser('Member A');
    const later = await createTestUser('Member B');
    const stranger = await createTestUser('Stranger B');
    await befriend(owner, member);
    await befriend(owner, later);
    await befriend(member, stranger);
    const id = await social.createChallenge(owner.client, {
      name: 'Passos',
      kind: 'steps',
      days: 30,
      startsOn: DAY,
      memberIds: [member.id],
    });

    await expect(social.addMembers(member.client, id, [stranger.id])).rejects.toMatchObject({
      code: 'forbidden',
    });
    await expect(social.addMembers(owner.client, id, [stranger.id])).rejects.toMatchObject({
      code: 'forbidden',
    });
    await social.addMembers(owner.client, id, [later.id]);
    expect((await social.listChallenges(later.client))[0]?.memberCount).toBe(3);
  });

  it('members leave; when the owner leaves the challenge ends', async () => {
    const owner = await createTestUser('Host');
    const member = await createTestUser('Guest');
    await befriend(owner, member);
    const id = await social.createChallenge(owner.client, {
      name: 'Saída',
      kind: 'day',
      days: 7,
      startsOn: DAY,
      memberIds: [member.id],
    });
    await social.leaveChallenge(member.client, id);
    expect(await social.listChallenges(member.client)).toEqual([]);
    expect((await social.listChallenges(owner.client))[0]?.memberCount).toBe(1);
    await expect(social.leaveChallenge(member.client, id)).rejects.toMatchObject({
      code: 'not_found',
    });

    await social.leaveChallenge(owner.client, id);
    expect(await social.listChallenges(owner.client)).toEqual([]);
  });
});
