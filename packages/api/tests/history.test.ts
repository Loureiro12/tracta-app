import { describe, expect, it } from 'vitest';

import { activities, history, sessions } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

import type { TestUser } from './helpers';

const OCTOBER = { from: '2026-10-01T00:00:00-03:00', to: '2026-11-01T00:00:00-03:00' };

async function ids(...slugs: string[]) {
  const { data } = await adminClient()
    .from('exercises')
    .select('id, slug')
    .is('owner_id', null)
    .in('slug', slugs);
  return slugs.map((s) => data!.find((e) => e.slug === s)!.id);
}

async function strength(user: TestUser, day: string, kg: number, reps = 8) {
  const [bench, dip] = await ids('supino-reto-com-barra', 'mergulho-nas-paralelas');
  return sessions.saveSession(user.client, {
    title: 'Treino A',
    focus: 'Peito',
    startedAt: `${day}T18:00:00-03:00`,
    endedAt: `${day}T19:00:00-03:00`,
    sets: [
      { exerciseId: bench!, exercisePosition: 0, setIndex: 0, kg, reps },
      { exerciseId: bench!, exercisePosition: 0, setIndex: 1, kg, reps },
      { exerciseId: dip!, exercisePosition: 1, setIndex: 0, kg: null, reps: 10 },
    ],
  });
}

function run(user: TestUser, day: string, splits: number[], partial?: [number, number]) {
  const all = splits.map((seconds) => ({ km: 1, seconds }));
  if (partial) all.push({ km: partial[0], seconds: partial[1] });
  const seconds = all.reduce((a, s) => a + s.seconds, 0);
  return activities.saveActivity(user.client, {
    kind: 'run',
    startedAt: `${day}T07:00:00-03:00`,
    durationSeconds: seconds,
    distanceM: Math.round((splits.length + (partial?.[0] ?? 0)) * 1000),
    gps: true,
    splits: all,
    avgHeartRate: 150,
  });
}

describe('history.getMonth', () => {
  it('lists the entries of the range with totals and the routine plan', async () => {
    const user = await createTestUser();
    await strength(user, '2026-10-19', 60);
    await run(user, '2026-10-24', [330, 333, 336, 339, 342, 328, 331, 334], [0.2, 68]);
    await strength(user, '2026-09-30', 50);
    const { error } = await adminClient()
      .from('routines')
      .insert({ owner_id: user.id, label: 'A', name: 'Treino A', focus: 'Peito', weekday: 0 });
    if (error) throw error;
    const month = await history.getMonth(user.client, OCTOBER);
    expect(month.entries.map((e) => e.kind)).toEqual(['strength', 'run']);
    expect(month.entries[0]).toMatchObject({
      title: 'Treino A',
      sets: 3,
      volumeKg: 960,
      durationSeconds: 3600,
    });
    expect(month.entries[1]).toMatchObject({ distanceM: 8200, avgHeartRate: 150 });
    expect(month.totals).toEqual({ workouts: 2, runKm: 8.2, volumeKg: 960 });
    expect(month.routines).toEqual([expect.objectContaining({ label: 'A', weekday: 0 })]);
  });

  it('validates the range and requires a session', async () => {
    const user = await createTestUser();
    await expect(
      history.getMonth(user.client, { from: 'yesterday', to: OCTOBER.to }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(history.getMonth(anonClient(), OCTOBER)).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it("never shows another user's entries", async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const id = await strength(owner, '2026-10-19', 60);
    expect((await history.getMonth(stranger.client, OCTOBER)).entries).toEqual([]);
    expect(await history.getEntryDetail(stranger.client, id)).toBeNull();
  });
});

describe('history.getEntryDetail', () => {
  it('resolves sessions and activities by id', async () => {
    const user = await createTestUser();
    const sessionId = await strength(user, '2026-10-19', 60);
    const activity = await run(user, '2026-10-24', [330, 333]);
    expect((await history.getEntryDetail(user.client, sessionId))?.kind).toBe('strength');
    expect(await history.getEntryDetail(user.client, activity.id)).toEqual({
      kind: 'activity',
      activity,
    });
    expect(await history.getEntryDetail(user.client, 'strength-25')).toBeNull();
  });
});

describe('history.getEvolution', () => {
  it('builds one point per session and the runs since `from`', async () => {
    const user = await createTestUser();
    await strength(user, '2026-07-01', 40);
    await strength(user, '2026-10-12', 57.5);
    await strength(user, '2026-10-19', 60, 7);
    await run(user, '2026-10-20', [330, 333, 336, 339, 342], [0.1, 32]);
    const evo = await history.getEvolution(user.client, { from: '2026-08-03T00:00:00-03:00' });
    expect(evo.exercises.map((e) => e.slug)).toEqual([
      'supino-reto-com-barra',
      'mergulho-nas-paralelas',
    ]);
    const bench = evo.exercises[0]!;
    expect(bench.points.map((p) => [p.topKg, p.topReps, p.volumeKg, p.totalReps])).toEqual([
      [57.5, 8, 920, 16],
      [60, 7, 840, 14],
    ]);
    expect(evo.exercises[1]).toMatchObject({ bodyweight: true });
    expect(evo.exercises[1]!.points[0]).toMatchObject({ topKg: null, maxReps: 10, volumeKg: 0 });
    expect(evo.runs).toEqual([
      expect.objectContaining({
        distanceKm: 5.1,
        durationSeconds: 1712,
        avgHeartRate: 150,
        gps: true,
      }),
    ]);
    expect(evo.runs[0]!.paceSeconds).toBeCloseTo(1712 / 5.1);
  });
});

describe('history.getRecords', () => {
  it('reports strength and run records with the previous best', async () => {
    const user = await createTestUser();
    await strength(user, '2026-10-05', 57.5);
    await strength(user, '2026-10-12', 60);
    await strength(user, '2026-10-19', 60);
    await run(user, '2026-06-07', [352, 345, 340, 342, 341, 341, 345, 365, 380, 406], [0.6, 250]);
    await run(
      user,
      '2026-07-12',
      [360, 365, 286, 330, 345, 350, 350, 368, 368, 370, 380, 385],
      [0.4, 160],
    );
    const records = await history.getRecords(user.client, {
      exerciseSlugs: ['supino-reto-com-barra', 'barra-fixa', 'mergulho-nas-paralelas'],
    });
    const [bench, pullup, dip] = records.strength;
    expect(bench).toMatchObject({ slug: 'supino-reto-com-barra', bodyweight: false });
    expect(bench!.best).toMatchObject({
      kg: 60,
      reps: 8,
      achievedAt: expect.stringContaining('2026-10-12'),
    });
    expect(bench!.previous).toMatchObject({ kg: 57.5 });
    expect(pullup).toEqual({ slug: 'barra-fixa', bodyweight: false, best: null, previous: null });
    expect(dip).toMatchObject({ bodyweight: true, best: { kg: null, reps: 10 }, previous: null });
    expect(records.run.fiveK.best?.value).toBe(1661);
    expect(records.run.fiveK.previous?.value).toBe(1709);
    expect(records.run.tenK.best?.value).toBe(3492);
    expect(records.run.tenK.previous?.value).toBe(3557);
    expect(records.run.best1k.best?.value).toBe(286);
    expect(records.run.longest).toMatchObject({
      best: { value: 12400 },
      previous: { value: 10600 },
    });
  });

  it('rejects malformed slugs and is empty for a new user', async () => {
    const user = await createTestUser();
    await expect(
      history.getRecords(user.client, { exerciseSlugs: ['Supino Reto'] }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    const records = await history.getRecords(user.client, { exerciseSlugs: ['stiff'] });
    expect(records.strength[0]?.best).toBeNull();
    expect(records.run.longest).toEqual({ best: null, previous: null });
  });
});
