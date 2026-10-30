import { describe, expect, it } from 'vitest';

import { activities } from '../src';
import { anonClient, createTestUser } from './helpers';
import { decodePolyline, encodePolyline } from '../src/polyline';

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

/** A short loop near Ibirapuera (São Paulo). */
const ROUTE: [number, number][] = [
  [-23.58741, -46.65762],
  [-23.58802, -46.65611],
  [-23.58913, -46.65588],
  [-23.58977, -46.65701],
  [-23.58741, -46.65762],
];

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
    expect(yoga).toMatchObject({
      distanceM: null,
      gps: false,
      splits: [],
      intervals: null,
      route: null,
    });
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

  it('saves the GPS route as a polyline and reads it back', async () => {
    const user = await createTestUser();
    const run = await activities.saveActivity(user.client, { ...RUN, route: ROUTE });
    expect(run.route).toHaveLength(ROUTE.length);
    run.route?.forEach(([lat, lng], i) => {
      expect(lat).toBeCloseTo(ROUTE[i]![0], 5);
      expect(lng).toBeCloseTo(ROUTE[i]![1], 5);
    });
    expect((await activities.getActivity(user.client, run.id))?.route).toEqual(run.route);
    const { data } = await user.client.from('activities').select('route').eq('id', run.id).single();
    expect(data?.route).toBe(encodePolyline(ROUTE));
    // Without a track the route stays null.
    expect((await activities.saveActivity(user.client, RUN)).route).toBeNull();
  });

  it('round-trips the polyline codec', () => {
    // Reference value from the Google polyline documentation.
    const reference: [number, number][] = [
      [38.5, -120.2],
      [40.7, -120.95],
      [43.252, -126.453],
    ];
    expect(encodePolyline(reference)).toBe('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual(reference);
    expect(decodePolyline('_p~iF~ps|U_')).toEqual([]);
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
    await expect(
      activities.saveActivity(user.client, { ...RUN, gps: false, route: ROUTE }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      activities.saveActivity(user.client, { ...RUN, route: [[-23.5, -46.6]] }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      activities.saveActivity(user.client, {
        ...RUN,
        route: [
          [-95, 0],
          [0, 0],
        ],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
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
