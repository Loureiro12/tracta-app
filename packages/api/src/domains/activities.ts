/** Activities: runs (GPS splits), walks, rides, swims and the other modalities. */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';
import { idSchema, notesInput, parse, rangeInput, listOf, requireUser } from './sessions';

import type { Range } from './sessions';
import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type ActivityRow = Database['public']['Tables']['activities']['Row'];

export type ActivityKind = Database['public']['Enums']['activity_kind'];

export const ACTIVITY_KINDS = [
  'run',
  'walk',
  'bike',
  'swim',
  'soccer',
  'basket',
  'tennis',
  'functional',
  'stretch',
  'yoga',
] as const satisfies readonly ActivityKind[];

/** One kilometre split; the last one may be partial (km < 1). */
export type Split = { km: number; seconds: number };

export type IntervalPlan = { reps: number; workSec: number; restSec: number; warmSec: number };

export type Activity = {
  id: string;
  kind: ActivityKind;
  startedAt: string;
  durationSeconds: number;
  /** Metres; null for modalities without distance. */
  distanceM: number | null;
  gps: boolean;
  splits: Split[];
  intervals: IntervalPlan | null;
  avgHeartRate: number | null;
  notes: string;
};

const splitSchema = z.object({
  km: z.number().gt(0).max(1),
  seconds: z.number().int().min(1).max(36000),
});
const intervalSchema = z.object({
  reps: z.number().int().min(1).max(50),
  workSec: z.number().int().min(1).max(3600),
  restSec: z.number().int().min(0).max(3600),
  warmSec: z.number().int().min(0).max(3600),
});

export const saveActivityInput = z.object({
  kind: z.enum(ACTIVITY_KINDS),
  startedAt: z.iso.datetime({ offset: true }),
  durationSeconds: z.number().int().min(1).max(172800),
  distanceM: z.number().int().min(0).max(1_000_000).nullable().optional(),
  gps: z.boolean().optional(),
  splits: z.array(splitSchema).max(1000).optional(),
  intervals: intervalSchema.nullable().optional(),
  avgHeartRate: z.number().int().min(30).max(250).nullable().optional(),
  notes: notesInput.optional(),
});

export type SaveActivityInput = z.input<typeof saveActivityInput>;

function asSplits(value: ActivityRow['splits']): Split[] {
  const parsed = z.array(splitSchema.loose()).safeParse(value);
  return parsed.success ? parsed.data.map((s) => ({ km: s.km, seconds: s.seconds })) : [];
}

function asIntervals(value: ActivityRow['intervals']): IntervalPlan | null {
  const parsed = intervalSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toActivity(r: ActivityRow): Activity {
  return {
    id: r.id,
    kind: r.kind,
    startedAt: r.started_at,
    durationSeconds: r.duration_seconds,
    distanceM: r.distance_m,
    gps: r.gps,
    splits: asSplits(r.splits),
    intervals: asIntervals(r.intervals),
    avgHeartRate: r.avg_heart_rate,
    notes: r.notes,
  };
}

export async function saveActivity(
  client: TractaClient,
  input: SaveActivityInput,
): Promise<Activity> {
  await requireUser(client);
  const a = parse(saveActivityInput, input);
  const row = unwrapOne(
    await client
      .from('activities')
      .insert({
        kind: a.kind,
        started_at: a.startedAt,
        duration_seconds: a.durationSeconds,
        distance_m: a.distanceM ?? null,
        gps: a.gps ?? false,
        splits: a.splits ?? [],
        intervals: a.intervals ?? null,
        avg_heart_rate: a.avgHeartRate ?? null,
        notes: a.notes ?? '',
      })
      .select('*')
      .single(),
    'activity',
  );
  return toActivity(row);
}

export const listActivitiesInput = z.object({ kind: z.enum(ACTIVITY_KINDS).optional() });

/** Activities that started inside [from, to), oldest first (optionally one kind). */
export async function listActivities(
  client: TractaClient,
  range: Range & z.input<typeof listActivitiesInput>,
): Promise<Activity[]> {
  await requireUser(client);
  const r = parse(rangeInput, { from: range.from, to: range.to });
  const { kind } = parse(listActivitiesInput, { kind: range.kind });
  let query = client
    .from('activities')
    .select('*')
    .gte('started_at', r.from)
    .lt('started_at', r.to)
    .order('started_at');
  if (kind) query = query.eq('kind', kind);
  return listOf(await query).map(toActivity);
}

/** One activity; null when missing or not visible to the caller. */
export async function getActivity(client: TractaClient, id: string): Promise<Activity | null> {
  await requireUser(client);
  if (!idSchema.safeParse(id).success) return null;
  const row = unwrap(await client.from('activities').select('*').eq('id', id).maybeSingle());
  return row ? toActivity(row) : null;
}

export async function deleteActivity(client: TractaClient, id: string): Promise<void> {
  await requireUser(client);
  parse(idSchema, id);
  const rows = listOf(await client.from('activities').delete().eq('id', id).select('id'));
  if (rows.length === 0) throw new ApiError('not_found', 'activity not found');
}

export async function updateActivityNotes(
  client: TractaClient,
  id: string,
  notes: string,
): Promise<void> {
  await requireUser(client);
  parse(idSchema, id);
  const value = parse(notesInput, notes);
  const rows = listOf(
    await client.from('activities').update({ notes: value }).eq('id', id).select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'activity not found');
}
