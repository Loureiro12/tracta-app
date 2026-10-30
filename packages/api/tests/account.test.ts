import { describe, expect, it } from 'vitest';

import { account, photos } from '../src';
import { adminClient, anonClient, createTestUser, uniqueHandle } from './helpers';

import type { TestUser } from './helpers';

/** Logs one workout session (with a set) and one run for the user, as the user. */
async function logHistory(user: TestUser) {
  const { data: exercise } = await user.client
    .from('exercises')
    .select('id')
    .is('owner_id', null)
    .limit(1)
    .single();
  const session = await user.client
    .from('workout_sessions')
    .insert({
      title: 'Treino A',
      started_at: '2026-10-20T10:00:00Z',
      ended_at: '2026-10-20T11:00:00Z',
    })
    .select('id')
    .single();
  if (session.error || !exercise) throw session.error ?? new Error('no built-in exercise');
  const set = await user.client.from('session_sets').insert({
    session_id: session.data.id,
    exercise_id: exercise.id,
    exercise_position: 0,
    set_index: 0,
    kg: 60,
    reps: 8,
  });
  if (set.error) throw set.error;
  const run = await user.client.from('activities').insert({
    kind: 'run',
    started_at: '2026-10-21T07:00:00Z',
    duration_seconds: 1800,
    distance_m: 5000,
  });
  if (run.error) throw run.error;
  return session.data.id;
}

async function countOwned(table: 'workout_sessions' | 'activities', ownerId: string) {
  const { count } = await adminClient()
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', ownerId);
  return count;
}

describe('account', () => {
  it('requires a session', async () => {
    await expect(account.getAccount(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('updates name and handle, and enforces handle format and uniqueness', async () => {
    const a = await createTestUser('Alice');
    const b = await createTestUser('Bob');
    const handle = uniqueHandle('al');

    const profile = await account.updateProfile(a.client, {
      name: 'Alice Andrade',
      handle: handle.toUpperCase(),
    });
    expect(profile).toMatchObject({ name: 'Alice Andrade', handle });

    await expect(account.updateProfile(b.client, { handle })).rejects.toMatchObject({
      code: 'conflict',
    });
    await expect(account.updateProfile(b.client, { handle: 'no spaces' })).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(account.updateProfile(b.client, { name: '   ' })).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('patches settings without touching other fields', async () => {
    const { client } = await createTestUser('Settings');
    const s = await account.updateSettings(client, {
      units: 'lb',
      visibility: 'me',
      notifications: { daily: true },
      share: { loads: true },
      reminderMinutes: 1140,
    });
    expect(s.units).toBe('lb');
    expect(s.visibility).toBe('me');
    expect(s.notifications).toMatchObject({ daily: true, rest: true, weekly: true });
    expect(s.share).toMatchObject({ loads: true, prs: false, done: true });
    expect(s.reminderMinutes).toBe(1140);
    expect(s.autoRest).toBe(true);
  });

  it('reports the subscription written by the backend and derives isPro', async () => {
    const user = await createTestUser('Subscriber');
    const free = await account.getAccount(user.client);
    expect(free.subscription).toBeNull();
    expect(free.isPro).toBe(false);

    const { error } = await adminClient().from('subscriptions').insert({
      user_id: user.id,
      plan: 'year',
      status: 'trialing',
      trial_ends_at: '2026-11-02T00:00:00Z',
    });
    expect(error).toBeNull();
    const pro = await account.getAccount(user.client);
    expect(pro.subscription).toMatchObject({
      plan: 'year',
      status: 'trialing',
      cancelAtPeriodEnd: false,
    });
    expect(pro.isPro).toBe(true);

    // Clients can never grant themselves PRO.
    const forged = await user.client
      .from('subscriptions')
      .update({ status: 'active' })
      .eq('user_id', user.id)
      .select();
    expect(forged.error ?? forged.data).toBeTruthy();
    expect(forged.data ?? []).toEqual([]);
  });

  it('validates goal ranges and persists valid goals', async () => {
    const { client } = await createTestUser('Goals');
    await expect(account.updateGoals(client, { steps: 10 })).rejects.toMatchObject({
      code: 'validation',
    });
    const goals = await account.updateGoals(client, { steps: 12000, workoutsPerWeek: 5 });
    expect(goals).toEqual({ steps: 12000, sleepMinutes: 450, workoutsPerWeek: 5, runKm: 15 });
    expect((await account.getAccount(client)).goals.steps).toBe(12000);
  });

  it("never exposes another user's account rows", async () => {
    const a = await createTestUser('Private A');
    const b = await createTestUser('Private B');
    const { data } = await a.client.from('goals').select('user_id');
    expect(data?.map((r) => r.user_id)).toEqual([a.id]);
    const res = await a.client
      .from('user_settings')
      .update({ units: 'lb' })
      .eq('user_id', b.id)
      .select();
    expect(res.data).toEqual([]);
  });

  it('deletes the account and everything it owns, photo files included', async () => {
    const user = await createTestUser('Goodbye');
    await photos.uploadPhoto(user.client, {
      takenOn: '2026-10-26',
      contentType: 'image/jpeg',
      data: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
    });
    await account.deleteAccount(user.client);
    const admin = adminClient();
    const objects = await admin.storage.from(photos.PHOTOS_BUCKET).list(user.id);
    expect(objects.data ?? []).toEqual([]);
    const { data } = await admin.auth.admin.getUserById(user.id);
    expect(data.user).toBeNull();
    const { count } = await admin
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
    expect(count).toBe(0);
  });

  it('validates the settings patch before writing', async () => {
    const { client } = await createTestUser('Settings validation');
    await expect(account.updateSettings(client, { reminderMinutes: 1440 })).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      account.updateSettings(client, { units: 'stone' as unknown as 'kg' }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      account.updateSettings(client, {
        notifications: { marketing: true } as unknown as { rest: boolean },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    const unchanged = await account.getAccount(client);
    expect(unchanged.settings.reminderMinutes).toBe(1110);
    expect(unchanged.settings.units).toBe('kg');
  });

  it('cycles visibility and toggles auto rest and units', async () => {
    const { client } = await createTestUser('Prefs');
    const s = await account.updateSettings(client, {
      visibility: 'all',
      autoRest: false,
      units: 'lb',
      notifications: { remind: false },
    });
    expect(s).toMatchObject({ visibility: 'all', autoRest: false, units: 'lb' });
    expect(s.notifications.remind).toBe(false);
    expect((await account.getAccount(client)).settings).toEqual(s);
  });

  it('starts an e-mail change without switching the login e-mail, and rejects taken ones', async () => {
    const a = await createTestUser('Mail A');
    const b = await createTestUser('Mail B');
    await expect(account.updateEmail(a.client, 'not-an-email')).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(account.updateEmail(a.client, b.email)).rejects.toMatchObject({
      code: 'email_taken',
    });
    await account.updateEmail(a.client, `${uniqueHandle('new')}@test.local`);
    // double_confirm_changes: the address only changes after both links are confirmed.
    expect((await account.getAccount(a.client)).profile.email).toBe(a.email);
  });

  it('requires a session to delete the history', async () => {
    await expect(account.deleteHistory(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it("deletes the user's sessions (with sets) and activities, and nobody else's", async () => {
    const owner = await createTestUser('History owner');
    const other = await createTestUser('History other');
    const sessionId = await logHistory(owner);
    await logHistory(other);

    expect(await account.deleteHistory(owner.client)).toEqual({ sessions: 1, activities: 1 });
    expect(await countOwned('workout_sessions', owner.id)).toBe(0);
    expect(await countOwned('activities', owner.id)).toBe(0);
    const { count: sets } = await adminClient()
      .from('session_sets')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    expect(sets).toBe(0);

    // The other user's history is untouched, and a second call is a no-op.
    expect(await countOwned('workout_sessions', other.id)).toBe(1);
    expect(await countOwned('activities', other.id)).toBe(1);
    expect(await account.deleteHistory(owner.client)).toEqual({ sessions: 0, activities: 0 });
    // Profile, settings and goals survive.
    expect((await account.getAccount(owner.client)).profile.name).toBe('History owner');
  });

  it("cannot delete another user's history rows directly", async () => {
    const owner = await createTestUser('Victim');
    const attacker = await createTestUser('Attacker');
    await logHistory(owner);
    const res = await attacker.client
      .from('workout_sessions')
      .delete()
      .eq('owner_id', owner.id)
      .select('id');
    expect(res.data).toEqual([]);
    expect(await countOwned('workout_sessions', owner.id)).toBe(1);
  });

  it('exports everything the user owns as one JSON document, and nothing else', async () => {
    await expect(account.exportData(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
    const owner = await createTestUser('Exporter');
    const other = await createTestUser('Bystander');
    await logHistory(owner);
    await logHistory(other);
    await account.updateGoals(owner.client, { steps: 12000 });
    const photo = await photos.uploadPhoto(owner.client, {
      takenOn: '2026-10-26',
      contentType: 'image/jpeg',
      weightKg: 78.1,
      data: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
    });

    const data = await account.exportData(owner.client);
    expect(data).toMatchObject({
      format: 'tracta-export',
      version: 1,
      user_id: owner.id,
      email: owner.email,
      profile: { id: owner.id, name: 'Exporter' },
    });
    const t = data.tables;
    expect(t.goals).toEqual([expect.objectContaining({ steps: 12000 })]);
    expect(t.user_settings).toHaveLength(1);
    expect(t.workout_sessions).toEqual([
      expect.objectContaining({ title: 'Treino A', sets: [expect.objectContaining({ reps: 8 })] }),
    ]);
    expect(t.activities).toHaveLength(1);
    expect(t.progress_photos).toEqual([
      expect.objectContaining({ id: photo.id, taken_on: '2026-10-26', weight_kg: 78.1 }),
    ]);
    for (const key of [
      'routines',
      'body_measurements',
      'friend_requests',
      'challenges',
      'notifications',
    ])
      expect(Array.isArray(t[key])).toBe(true);
    expect(JSON.stringify(data)).not.toContain(other.id);
  });
});
