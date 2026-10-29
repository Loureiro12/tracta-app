/** Body measurements: manual log (one entry per day) and scale readings imported from Health. */
import { z } from 'zod';

import { unwrap, unwrapOne } from '../errors';
import { parse, listOf, requireUser } from './sessions';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type BodyRow = Database['public']['Tables']['body_measurements']['Row'];

export type BodySource = Database['public']['Enums']['data_source'];

export type BodyMeasurement = {
  id: string;
  /** Calendar day, YYYY-MM-DD. */
  measuredOn: string;
  weightKg: number | null;
  waistCm: number | null;
  hipCm: number | null;
  armCm: number | null;
  source: BodySource;
};

const n = (v: number | string | null) => (v === null ? null : Number(v));

function toMeasurement(r: BodyRow): BodyMeasurement {
  return {
    id: r.id,
    measuredOn: r.measured_on,
    weightKg: n(r.weight_kg),
    waistCm: n(r.waist_cm),
    hipCm: n(r.hip_cm),
    armCm: n(r.arm_cm),
    source: r.source,
  };
}

const day = z.iso.date();

export const logBodyInput = z
  .object({
    measuredOn: day,
    weightKg: z.number().min(20).max(400).optional(),
    waistCm: z.number().min(30).max(250).optional(),
    hipCm: z.number().min(30).max(250).optional(),
    armCm: z.number().min(10).max(100).optional(),
  })
  .refine((b) => [b.weightKg, b.waistCm, b.hipCm, b.armCm].some((v) => v !== undefined), {
    message: 'log at least one value',
  });

export type LogBodyInput = z.input<typeof logBodyInput>;

/**
 * Manual entry for a day (the app passes its local "today"). Logging again the same day updates
 * that entry; values left out are kept.
 */
export async function logBody(client: TractaClient, input: LogBodyInput): Promise<BodyMeasurement> {
  const userId = await requireUser(client);
  const b = parse(logBodyInput, input);
  const row: Database['public']['Tables']['body_measurements']['Insert'] = {
    owner_id: userId,
    measured_on: b.measuredOn,
    source: 'manual',
  };
  if (b.weightKg !== undefined) row.weight_kg = Math.round(b.weightKg * 100) / 100;
  if (b.waistCm !== undefined) row.waist_cm = Math.round(b.waistCm * 10) / 10;
  if (b.hipCm !== undefined) row.hip_cm = Math.round(b.hipCm * 10) / 10;
  if (b.armCm !== undefined) row.arm_cm = Math.round(b.armCm * 10) / 10;
  const saved = unwrapOne(
    await client
      .from('body_measurements')
      .upsert(row, { onConflict: 'owner_id,measured_on,source' })
      .select('*')
      .single(),
    'measurement',
  );
  return toMeasurement(saved);
}

export const bodyRangeInput = z
  .object({ from: day, to: day })
  .refine((r) => r.from <= r.to, { message: '`from` must not be after `to`' });

/** Entries between two calendar days (inclusive), oldest first. */
export async function listBody(
  client: TractaClient,
  range: z.input<typeof bodyRangeInput>,
): Promise<BodyMeasurement[]> {
  await requireUser(client);
  const r = parse(bodyRangeInput, range);
  return listOf(
    await client
      .from('body_measurements')
      .select('*')
      .gte('measured_on', r.from)
      .lte('measured_on', r.to)
      .order('measured_on')
      .order('source'),
  ).map(toMeasurement);
}

export type LatestValue = { value: number; measuredOn: string; source: BodySource };

export type LatestBody = {
  weight: LatestValue | null;
  waist: LatestValue | null;
  hip: LatestValue | null;
  arm: LatestValue | null;
};

/** Most recent value of each measure (they may come from different days). */
export async function latestBody(client: TractaClient): Promise<LatestBody> {
  await requireUser(client);
  const pick = async (column: 'weight_kg' | 'waist_cm' | 'hip_cm' | 'arm_cm') => {
    const row = unwrap(
      await client
        .from('body_measurements')
        .select('*')
        .not(column, 'is', null)
        // a manual entry wins over a Health reading of the same day
        .order('measured_on', { ascending: false })
        .order('source', { ascending: true })
        .limit(1)
        .maybeSingle(),
    );
    return row && row[column] !== null
      ? { value: Number(row[column]), measuredOn: row.measured_on, source: row.source }
      : null;
  };
  const [weight, waist, hip, arm] = await Promise.all([
    pick('weight_kg'),
    pick('waist_cm'),
    pick('hip_cm'),
    pick('arm_cm'),
  ]);
  return { weight, waist, hip, arm };
}
