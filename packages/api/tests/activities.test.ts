import { describe, expect, it } from 'vitest';

import { activities } from '../src';
import { anonClient, createTestUser } from './helpers';

const RUN = {
  kind: 'run' as const,
  startedAt: '2026-10-24T10:26:00+00:00',
  durationSeconds: 2741,
  distanceM: 8200,
  gps: true,
  splits: [
    { km: 1, seconds: 330 },
    { km: 0.2, seconds: 68 },
  ],
  intervals: { reps: 6, workSec: 60, restSec: 90, warmSec: 300 },
  avgHeartRate: 154,
  notes: 'Leve',
};

describe('activities', () => {
  it('saves, lists by range and kind, and reads a run back', async () => {
    const user = await createTestUser();
    const run = await activities.saveActivity(user.client, RUN);
    expect(run).toMatchObject({ ...RUN, id: expect.any(String) });
    const yoga = await activities.saveActivity(user.client, {
      kind: 'yoga',
      startedAt: '2026-10-25T08:00:00-03:00',
      durationSeconds: 1800,
    });
    expect(yoga).toMatchObject({ distanceM: null, gps: false, splits: [], intervals: null });
    const range = { from: '2026-10-01T00:00:00-03:00', to: '2026-11-01T00:00:00-03:00' };
    expect((await activities.listActivities(user.client, range)).map((a) => a.kind)).toEqual([
      'run',
      'yoga',
    ]);
    expect(
      (await activities.listActivities(user.client, { ...range, kind: 'yoga' })).map((a) => a.id),
    ).toEqual([yoga.id]);
    expect(await activities.getActivity(user.client, run.id)).toEqual(run);
  });

  it('validates the input', async () => {
    const user = await createTestUser();
    await expect(
      activities.saveActivity(user.client, { ...RUN, durationSeconds: 0 }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      activities.saveActivity(user.client, { ...RUN, kind: 'chess' as 'run' }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      activities.saveActivity(user.client, { ...RUN, avgHeartRate: 300 }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(activities.saveActivity(anonClient(), RUN)).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('updates notes and deletes', async () => {
    const user = await createTestUser();
    const run = await activities.saveActivity(user.client, RUN);
    await activities.updateActivityNotes(user.client, run.id, 'Forte');
    expect((await activities.getActivity(user.client, run.id))?.notes).toBe('Forte');
    await activities.deleteActivity(user.client, run.id);
    expect(await activities.getActivity(user.client, run.id)).toBeNull();
    await expect(activities.deleteActivity(user.client, run.id)).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(activities.deleteActivity(user.client, 'run-24')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('another user cannot read, change or delete it', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    const run = await activities.saveActivity(owner.client, RUN);
    expect(await activities.getActivity(stranger.client, run.id)).toBeNull();
    expect(
      await activities.listActivities(stranger.client, {
        from: '2026-10-01T00:00:00Z',
        to: '2026-11-01T00:00:00Z',
      }),
    ).toEqual([]);
    await expect(
      activities.updateActivityNotes(stranger.client, run.id, 'x'),
    ).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(activities.deleteActivity(stranger.client, run.id)).rejects.toMatchObject({
      code: 'not_found',
    });
    expect(await activities.getActivity(owner.client, run.id)).not.toBeNull();
  });
});
