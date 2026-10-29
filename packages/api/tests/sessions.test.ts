import { describe, expect, it } from 'vitest';

import { sessions } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

import type { TestUser } from './helpers';

async function libraryIds(...slugs: string[]): Promise<string[]> {
  const { data, error } = await adminClient()
    .from('exercises')
    .select('id, slug')
    .is('owner_id', null)
    .in('slug', slugs);
  if (error || !data) throw error ?? new Error('no exercises');
  return slugs.map((slug) => data.find((e) => e.slug === slug)!.id);
}

async function saveBench(user: TestUser, day: string, kg: number, reps = 8) {
  const [bench, dip] = await libraryIds('supino-reto-com-barra', 'mergulho-nas-paralelas');
  return sessions.saveSession(user.client, {
    title: 'Treino A',
    focus: 'Peito & Tríceps',
    startedAt: `${day}T18:41:00-03:00`,
    endedAt: `${day}T19:42:00-03:00`,
    sets: [
      { exerciseId: bench!, exercisePosition: 0, setIndex: 0, kg: 20, reps: 8, isWarmup: true },
      { exerciseId: bench!, exercisePosition: 0, setIndex: 0, kg, reps },
      { exerciseId: bench!, exercisePosition: 0, setIndex: 1, kg: kg - 2.5, reps },
      { exerciseId: dip!, exercisePosition: 1, setIndex: 0, kg: null, reps: 10, superset: 'S1' },
    ],
  });
}

describe('sessions.saveSession / getSession', () => {
  it('saves a session atomically and reads it back grouped per exercise', async () => {
    const user = await createTestUser();
    const id = await saveBench(user, '2026-10-19', 60);
    const detail = await sessions.getSession(user.client, id);
    expect(detail).toMatchObject({
      id,
      title: 'Treino A',
      focus: 'Peito & Tríceps',
      durationSeconds: 61 * 60,
      sets: 3,
      reps: 26,
      volumeKg: 60 * 8 + 57.5 * 8,
    });
    expect(detail?.exercises.map((e) => [e.slug, e.bodyweight, e.sets.length])).toEqual([
      ['supino-reto-com-barra', false, 3],
      ['mergulho-nas-paralelas', true, 1],
    ]);
    expect(detail?.exercises[0]?.sets[0]).toEqual({ setIndex: 0, kg: 20, reps: 8, isWarmup: true });
    expect(detail?.exercises[0]?.pr).toBe(true);
  });

  it('rejects invalid payloads with validation', async () => {
    const user = await createTestUser();
    await expect(
      sessions.saveSession(user.client, {
        title: ' ',
        startedAt: '2026-10-19T10:00:00Z',
        endedAt: '2026-10-19T11:00:00Z',
        sets: [],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      sessions.saveSession(user.client, {
        title: 'x',
        startedAt: '2026-10-19T10:00:00Z',
        endedAt: '2026-10-19T09:00:00Z',
        sets: [],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('requires a signed-in user', async () => {
    await expect(
      sessions.listSessions(anonClient(), {
        from: '2026-10-01T00:00:00Z',
        to: '2026-11-01T00:00:00Z',
      }),
    ).rejects.toMatchObject({ code: 'not_authenticated' });
  });

  it('returns null for unknown or malformed ids', async () => {
    const user = await createTestUser();
    expect(await sessions.getSession(user.client, 'strength-25')).toBeNull();
    expect(
      await sessions.getSession(user.client, '00000000-0000-4000-8000-00000000ffff'),
    ).toBeNull();
  });
});

describe('sessions.listSessions / lastSets / records', () => {
  it('lists by range, returns the previous sets and the best set', async () => {
    const user = await createTestUser();
    const older = await saveBench(user, '2026-10-12', 62.5, 5);
    const newer = await saveBench(user, '2026-10-19', 60);
    const list = await sessions.listSessions(user.client, {
      from: '2026-10-15T00:00:00-03:00',
      to: '2026-10-20T00:00:00-03:00',
    });
    expect(list.map((s) => s.id)).toEqual([newer]);
    const [bench] = await libraryIds('supino-reto-com-barra');
    const last = await sessions.lastSets(user.client, [bench!]);
    expect(last[bench!]?.map((s) => [s.kg, s.reps])).toEqual([
      [60, 8],
      [57.5, 8],
    ]);
    const records = await sessions.listPersonalRecords(user.client);
    expect(records.find((r) => r.slug === 'supino-reto-com-barra')).toMatchObject({
      kg: 62.5,
      reps: 5,
      sessionId: older,
    });
  });

  it('rejects a reversed range', async () => {
    const user = await createTestUser();
    await expect(
      sessions.listSessions(user.client, {
        from: '2026-11-01T00:00:00Z',
        to: '2026-10-01T00:00:00Z',
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });
});

describe('sessions: notes and delete', () => {
  it('updates notes and deletes own sessions', async () => {
    const user = await createTestUser();
    const id = await saveBench(user, '2026-10-19', 60);
    await sessions.updateSessionNotes(user.client, id, 'Bom treino');
    expect((await sessions.getSession(user.client, id))?.notes).toBe('Bom treino');
    await expect(
      sessions.updateSessionNotes(user.client, id, 'x'.repeat(1001)),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await sessions.deleteSession(user.client, id);
    expect(await sessions.getSession(user.client, id)).toBeNull();
    await expect(sessions.deleteSession(user.client, id)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('another user cannot read, change or delete the session', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const id = await saveBench(owner, '2026-10-19', 60);
    expect(await sessions.getSession(stranger.client, id)).toBeNull();
    await expect(sessions.updateSessionNotes(stranger.client, id, 'hi')).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(sessions.deleteSession(stranger.client, id)).rejects.toMatchObject({
      code: 'not_found',
    });
    const [bench] = await libraryIds('supino-reto-com-barra');
    expect(await sessions.lastSets(stranger.client, [bench!])).toEqual({});
    expect(await sessions.getSession(owner.client, id)).not.toBeNull();
  });
});
