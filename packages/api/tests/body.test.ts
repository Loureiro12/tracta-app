import { describe, expect, it } from 'vitest';

import { body } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

describe('body', () => {
  it('logs one manual entry per day and keeps values left out', async () => {
    const user = await createTestUser();
    const first = await body.logBody(user.client, { measuredOn: '2026-10-26', weightKg: 80.5 });
    expect(first).toMatchObject({
      measuredOn: '2026-10-26',
      weightKg: 80.5,
      waistCm: null,
      source: 'manual',
    });
    const second = await body.logBody(user.client, {
      measuredOn: '2026-10-26',
      waistCm: 86,
      armCm: 36,
    });
    expect(second).toMatchObject({ id: first.id, weightKg: 80.5, waistCm: 86, armCm: 36 });
    expect(await body.listBody(user.client, { from: '2026-10-01', to: '2026-10-31' })).toHaveLength(
      1,
    );
  });

  it('returns the latest value of each measure', async () => {
    const user = await createTestUser();
    const { error } = await adminClient()
      .from('body_measurements')
      .insert([
        {
          owner_id: user.id,
          measured_on: '2026-10-05',
          waist_cm: 86,
          hip_cm: 98,
          arm_cm: 35.5,
          source: 'manual',
        },
        { owner_id: user.id, measured_on: '2026-10-25', weight_kg: 78.1, source: 'health' },
      ]);
    if (error) throw error;
    expect(await body.latestBody(user.client)).toEqual({
      weight: { value: 78.1, measuredOn: '2026-10-25', source: 'health' },
      waist: { value: 86, measuredOn: '2026-10-05', source: 'manual' },
      hip: { value: 98, measuredOn: '2026-10-05', source: 'manual' },
      arm: { value: 35.5, measuredOn: '2026-10-05', source: 'manual' },
    });
    const range = await body.listBody(user.client, { from: '2026-10-01', to: '2026-10-20' });
    expect(range.map((m) => m.measuredOn)).toEqual(['2026-10-05']);
  });

  it('validates the input', async () => {
    const user = await createTestUser();
    await expect(body.logBody(user.client, { measuredOn: '2026-10-26' })).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      body.logBody(user.client, { measuredOn: '26/10', weightKg: 80 }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      body.logBody(user.client, { measuredOn: '2026-10-26', weightKg: 900 }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      body.listBody(user.client, { from: '2026-10-31', to: '2026-10-01' }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(body.latestBody(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('another user sees nothing', async () => {
    const owner = await createTestUser();
    const stranger = await createTestUser();
    await body.logBody(owner.client, { measuredOn: '2026-10-26', weightKg: 80 });
    expect(await body.listBody(stranger.client, { from: '2026-10-01', to: '2026-10-31' })).toEqual(
      [],
    );
    expect((await body.latestBody(stranger.client)).weight).toBeNull();
  });
});
