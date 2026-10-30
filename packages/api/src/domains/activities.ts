/** Activities: runs (GPS splits), walks, rides, swims and the other modalities. */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';
import { decodePolyline, encodePolyline } from '../polyline';
import { idSchema, notesInput, parse, rangeInput, listOf, requireUser } from './sessions';

import type { Range } from './sessions';
import type { TractaClient } from '../client';
import type { Database } from '../database.types';
import type { LatLng } from '../polyline';

export type { LatLng } from '../polyline';

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
  /** Recorded GPS track ([lat, lng], ~1 m precision); null when nothing was recorded. */
  route: LatLng[] | null;
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

const latLngSchema = z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)]);
/** Up to 20k points (~11 h at one point every 2 s); stored as an encoded polyline. */
const routeSchema = z.array(latLngSchema).min(2).max(20000);

export const saveActivityInput = z
  .object({
    kind: z.enum(ACTIVITY_KINDS),
    startedAt: z.iso.datetime({ offset: true }),
    durationSeconds: z.number().int().min(1).max(172800),
    distanceM: z.number().int().min(0).max(1_000_000).nullable().optional(),
    gps: z.boolean().optional(),
    splits: z.array(splitSchema).max(1000).optional(),
    intervals: intervalSchema.nullable().optional(),
    avgHeartRate: z.number().int().min(30).max(250).nullable().optional(),
    route: routeSchema.nullable().optional(),
    notes: notesInput.optional(),
  })
  .refine((a) => !a.route || a.gps === true, {
    message: 'a route needs a GPS activity',
    path: ['route'],
  });

export type SaveActivityInput = z.input<typeof saveActivityInput>;

function asSplits(value: ActivityRow['splits']): Split[] {
  const parsed = z.array(splitSchema.loose()).safeParse(value);
  return parsed.success ? parsed.data.map((s) => ({ km: s.km, seconds: s.seconds })) : [];
}

function asRoute(value: ActivityRow['route']): LatLng[] | null {
  if (!value) return null;
  const points = decodePolyline(value);
  return points.length >= 2 ? points : null;
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
    route: asRoute(r.route),
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
        route: a.route ? encodePolyline(a.route) : null,
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
