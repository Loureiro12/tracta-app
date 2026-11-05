import { describe, expect, it } from 'vitest';

import { activities, body, health, history } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

const HOURS = [
  0, 0, 0, 0, 0, 0, 120, 640, 820, 310, 260, 410, 980, 540, 380, 620, 1762, 0, 0, 0, 0, 0, 0, 0,
];
const HR = [
  56,
  54,
  53,
  52,
  52,
  53,
  58,
  72,
  84,
  78,
  74,
  80,
  92,
  76,
  73,
  79,
  88,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
];

async function summarySteps(userId: string, day: string): Promise<number | null> {
  const { data, error } = await adminClient()
    .from('daily_summaries')
    .select('steps')
    .eq('user_id', userId)
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  return data?.steps ?? null;
}

describe('health', () => {
  it('connects, syncs days and reads them back', async () => {
    const user = await createTestUser();
    expect(await health.getConnection(user.client)).toBeNull();
    await expect(
      health.syncDays(user.client, {
        source: 'apple_health',
        days: [{ day: '2026-10-26', steps: 1 }],
      }),
    ).rejects.toMatchObject({ code: 'not_found' });

    const connection = await health.connect(user.client, {
      source: 'apple_health',
      readTypes: ['steps', 'sleep'],
      writeTypes: ['workouts'],
    });
    expect(connection).toMatchObject({
      source: 'apple_health',
      readTypes: ['steps', 'sleep'],
      lastSyncedAt: null,
    });

    const syncedAt = await health.syncDays(user.client, {
      source: 'apple_health',
      days: [
        { day: '2026-10-25', steps: 9640, sleepMinutes: 455, restingHr: 61 },
        {
          day: '2026-10-26',
          steps: 6842,
          distanceM: 4900,
          activeKcal: 312,
          stepsHourly: HOURS,
          hrHourly: HR,
          sleepMinutes: 410,
          sleepStages: [
            ['light', 18],
            ['deep', 42],
          ],
          bedtime: '2026-10-25T23:48:00-03:00',
          wakeTime: '2026-10-26T07:00:00-03:00',
          restingHr: 58,
        },
      ],
    });
    expect(Date.parse(syncedAt)).not.toBeNaN();
    expect((await health.getConnection(user.client))?.lastSyncedAt).toBe(syncedAt);

    const days = await health.listDays(user.client, { from: '2026-10-01', to: '2026-10-31' });
    expect(days.map((d) => d.day)).toEqual(['2026-10-25', '2026-10-26']);
    expect(days[1]).toMatchObject({
      steps: 6842,
      distanceM: 4900,
      stepsHourly: HOURS,
      hrHourly: HR,
      sleepStages: [
        ['light', 18],
        ['deep', 42],
      ],
      restingHr: 58,
      restKcal: null,
    });
    expect(Date.parse(days[1]!.bedtime!)).toBe(Date.parse('2026-10-26T02:48:00Z'));
    // Steps feed the social summaries.
    expect(await summarySteps(user.id, '2026-10-26')).toBe(6842);
  });

  it('re-syncing replaces a day', async () => {
    const user = await createTestUser();
    await health.connect(user.client, { source: 'health_connect' });
    await health.syncDays(user.client, {
      source: 'health_connect',
      days: [{ day: '2026-10-26', steps: 5000, sleepMinutes: 400 }],
    });
    await health.syncDays(user.client, {
      source: 'health_connect',
      days: [{ day: '2026-10-26', steps: 7000 }],
    });
    const [today] = await health.listDays(user.client, { from: '2026-10-26', to: '2026-10-26' });
    expect(today).toMatchObject({ steps: 7000, sleepMinutes: null, source: 'health_connect' });
    expect(await summarySteps(user.id, '2026-10-26')).toBe(7000);
  });

  it('disconnects and optionally deletes the synced data', async () => {
    const user = await createTestUser();
    await health.connect(user.client, { source: 'apple_health' });
    await health.syncDays(user.client, {
      source: 'apple_health',
      days: [{ day: '2026-10-26', steps: 4000 }],
    });
    await health.disconnect(user.client);
    expect(await health.getConnection(user.client)).toBeNull();
    expect(
      await health.listDays(user.client, { from: '2026-10-26', to: '2026-10-26' }),
    ).toHaveLength(1);
    await health.deleteHealthData(user.client);
    expect(await health.listDays(user.client, { from: '2026-10-26', to: '2026-10-26' })).toEqual(
      [],
    );
    expect(await summarySteps(user.id, '2026-10-26')).toBeNull();

    await health.connect(user.client, { source: 'apple_health' });
    await health.syncDays(user.client, {
      source: 'apple_health',
      days: [{ day: '2026-10-26', steps: 4000 }],
    });
    await health.disconnect(user.client, { deleteData: true });
    expect(await health.listDays(user.client, { from: '2026-10-26', to: '2026-10-26' })).toEqual(
      [],
    );
  });

  it('validates the input', async () => {
    const user = await createTestUser();
    await health.connect(user.client, { source: 'apple_health' });
    await expect(
      health.syncDays(user.client, { source: 'apple_health', days: [{ day: '26/10' }] }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      health.syncDays(user.client, {
        source: 'apple_health',
        days: [{ day: '2026-10-26', stepsHourly: [1, 2, 3] }],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      health.syncDays(user.client, {
        source: 'apple_health',
        days: [{ day: '2026-10-26', sleepStages: [['nap' as never, 10]] }],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(health.connect(user.client, { source: 'fitbit' as never })).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      health.listDays(user.client, { from: '2026-10-31', to: '2026-10-01' }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(health.getConnection(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('another user sees nothing', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    await health.connect(owner.client, { source: 'apple_health' });
    await health.syncDays(owner.client, {
      source: 'apple_health',
      days: [{ day: '2026-10-26', steps: 4000 }],
    });
    expect(await health.getConnection(stranger.client)).toBeNull();
    expect(
      await health.listDays(stranger.client, { from: '2026-10-01', to: '2026-10-31' }),
    ).toEqual([]);
    await health.deleteHealthData(stranger.client);
    expect(
      await health.listDays(owner.client, { from: '2026-10-01', to: '2026-10-31' }),
    ).toHaveLength(1);
  });

  it('accepts Google Health as a source', async () => {
    const user = await createTestUser();
    const connection = await health.connect(user.client, {
      source: 'google_health',
      readTypes: ['steps'],
      writeTypes: [],
    });
    expect(connection.source).toBe('google_health');

    await health.syncDays(user.client, {
      source: 'google_health',
      days: [{ day: '2026-10-26', steps: 5000 }],
    });
    const [day] = await health.listDays(user.client, { from: '2026-10-26', to: '2026-10-26' });
    expect(day?.source).toBe('google_health');
  });

  it('imports workouts that then read like any other, and remembers deleted ones', async () => {
    const user = await createTestUser();
    await health.connect(user.client, { source: 'apple_health', readTypes: ['workouts'] });
    const workouts = [
      {
        id: 'hk-run',
        kind: 'run' as const,
        startedAt: '2026-10-20T06:00:00-03:00',
        endedAt: '2026-10-20T07:00:00-03:00',
        distanceM: 10000,
      },
      {
        id: 'hk-gym',
        kind: 'strength' as const,
        startedAt: '2026-10-21T18:00:00-03:00',
        endedAt: '2026-10-21T19:00:00-03:00',
      },
    ];
    const input = { source: 'apple_health' as const, workouts };
    await expect(health.importWorkouts(user.client, input)).resolves.toBe(2);
    await expect(health.importWorkouts(user.client, input)).resolves.toBe(0);

    const month = await history.getMonth(user.client, {
      from: '2026-10-01T00:00:00Z',
      to: '2026-11-01T00:00:00Z',
    });
    expect(month.totals.workouts).toBe(2);
    expect(month.totals.runKm).toBe(10);

    const run = month.entries.find((e) => e.kind === 'run')!;
    const detail = await history.getEntryDetail(user.client, run.id);
    expect(detail).toMatchObject({
      kind: 'activity',
      activity: { externalSource: 'apple_health', durationSeconds: 3600 },
    });
    const gym = month.entries.find((e) => e.kind === 'strength')!;
    expect(await history.getEntryDetail(user.client, gym.id)).toMatchObject({
      kind: 'strength',
      session: { externalSource: 'apple_health', sets: 0, exercises: [] },
    });

    await activities.deleteActivity(user.client, run.id);
    await expect(health.importWorkouts(user.client, input)).resolves.toBe(0);
  });

  it('refuses a workout that ends before it starts', async () => {
    const user = await createTestUser();
    await expect(
      health.importWorkouts(user.client, {
        source: 'apple_health',
        workouts: [
          {
            id: 'x',
            kind: 'run',
            startedAt: '2026-10-20T07:00:00Z',
            endedAt: '2026-10-20T06:00:00Z',
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('deleting health data removes imported readings, not manual ones or workouts', async () => {
    const user = await createTestUser();
    await health.connect(user.client, { source: 'apple_health' });
    await body.logBody(user.client, { measuredOn: '2026-10-26', weightKg: 80 });
    await body.importBody(user.client, [{ measuredOn: '2026-10-25', weightKg: 79 }]);
    await health.importWorkouts(user.client, {
      source: 'apple_health',
      workouts: [
        {
          id: 'hk-run',
          kind: 'run',
          startedAt: '2026-10-20T06:00:00Z',
          endedAt: '2026-10-20T07:00:00Z',
        },
      ],
    });

    await health.deleteHealthData(user.client);

    const rows = await body.listBody(user.client, { from: '2026-10-25', to: '2026-10-26' });
    expect(rows.map((r) => r.source)).toEqual(['manual']);
    const month = await history.getMonth(user.client, {
      from: '2026-10-01T00:00:00Z',
      to: '2026-11-01T00:00:00Z',
    });
    expect(month.totals.workouts).toBe(1);
  });
});
