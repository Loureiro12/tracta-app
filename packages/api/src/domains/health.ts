/**
 * Health: daily aggregates read on the device (Apple Health / Health Connect) and synced here,
 * plus the connection itself (which source, which data types, last sync).
 * Steps synced here also feed `daily_summaries.steps` (friends' feed, challenges).
 */
import { z } from 'zod';

import { ApiError, unwrap, unwrapOne } from '../errors';
import { listOf, parse, requireUser } from './sessions';

import type { TractaClient } from '../client';
import type { Database, Json } from '../database.types';

type DayRow = Database['public']['Tables']['health_days']['Row'];
type ConnectionRow = Database['public']['Tables']['health_connections']['Row'];

export const HEALTH_SOURCES = ['apple_health', 'health_connect'] as const;
export type HealthSource = (typeof HEALTH_SOURCES)[number];

export const SLEEP_STAGES = ['awake', 'rem', 'light', 'deep'] as const;
export type SleepStage = (typeof SLEEP_STAGES)[number];
/** One hypnogram segment: stage and minutes, in chronological order. */
export type SleepSegment = readonly [SleepStage, number];

export type HealthConnection = {
  source: HealthSource;
  readTypes: string[];
  writeTypes: string[];
  connectedAt: string;
  /** ISO instant of the last successful sync, null before the first one. */
  lastSyncedAt: string | null;
};

/** One local calendar day. Null = no reading for that metric. Sleep = night ending that day. */
export type HealthDay = {
  day: string;
  source: HealthSource;
  steps: number | null;
  distanceM: number | null;
  activeKcal: number | null;
  restKcal: number | null;
  activeMinutes: number | null;
  intenseMinutes: number | null;
  /** 24 values (0h … 23h) or null. */
  stepsHourly: number[] | null;
  sleepMinutes: number | null;
  inBedMinutes: number | null;
  awakeMinutes: number | null;
  wakeups: number | null;
  bedtime: string | null;
  wakeTime: string | null;
  sleepStages: SleepSegment[] | null;
  restingHr: number | null;
  hrMin: number | null;
  hrMax: number | null;
  /** 24 hourly averages (null where there was no reading) or null. */
  hrHourly: (number | null)[] | null;
  syncedAt: string;
};

const sourceSchema = z.enum(HEALTH_SOURCES);
const stageSchema = z.enum(SLEEP_STAGES);
const segmentSchema = z.tuple([stageSchema, z.number().int().min(0).max(1440)]);
const day = z.iso.date();
const int = (min: number, max: number) => z.number().int().min(min).max(max).nullish();
const instant = z.iso.datetime({ offset: true }).nullish();

export const healthDayInput = z.object({
  day,
  steps: int(0, 200000),
  distanceM: int(0, 1000000),
  activeKcal: int(0, 20000),
  restKcal: int(0, 20000),
  activeMinutes: int(0, 1440),
  intenseMinutes: int(0, 1440),
  stepsHourly: z.array(z.number().int().min(0).max(200000)).length(24).nullish(),
  sleepMinutes: int(0, 1440),
  inBedMinutes: int(0, 1440),
  awakeMinutes: int(0, 1440),
  wakeups: int(0, 200),
  bedtime: instant,
  wakeTime: instant,
  sleepStages: z.array(segmentSchema).max(500).nullish(),
  restingHr: int(20, 250),
  hrMin: int(20, 250),
  hrMax: int(20, 250),
  hrHourly: z.array(z.number().int().min(20).max(250).nullable()).length(24).nullish(),
});
export type HealthDayInput = z.input<typeof healthDayInput>;

export const syncInput = z.object({
  source: sourceSchema,
  days: z.array(healthDayInput).max(120),
});
export type SyncInput = z.input<typeof syncInput>;

export const connectInput = z.object({
  source: sourceSchema,
  readTypes: z.array(z.string().min(1).max(32)).max(16).default([]),
  writeTypes: z.array(z.string().min(1).max(32)).max(16).default([]),
});
export type ConnectInput = z.input<typeof connectInput>;

export const daysRangeInput = z
  .object({ from: day, to: day })
  .refine((r) => r.from <= r.to, { message: '`from` must not be after `to`' });

function toSource(v: string): HealthSource {
  return v === 'health_connect' ? 'health_connect' : 'apple_health';
}

function toConnection(r: ConnectionRow): HealthConnection {
  return {
    source: toSource(r.source),
    readTypes: r.read_types,
    writeTypes: r.write_types,
    connectedAt: r.connected_at,
    lastSyncedAt: r.last_synced_at,
  };
}

function toStages(v: Json | null): SleepSegment[] | null {
  if (!Array.isArray(v)) return null;
  const out: SleepSegment[] = [];
  for (const item of v) {
    const seg = segmentSchema.safeParse(item);
    if (seg.success) out.push(seg.data);
  }
  return out;
}

function toDay(r: DayRow): HealthDay {
  return {
    day: r.day,
    source: toSource(r.source),
    steps: r.steps,
    distanceM: r.distance_m,
    activeKcal: r.active_kcal,
    restKcal: r.rest_kcal,
    activeMinutes: r.active_minutes,
    intenseMinutes: r.intense_minutes,
    stepsHourly: r.steps_hourly,
    sleepMinutes: r.sleep_minutes,
    inBedMinutes: r.in_bed_minutes,
    awakeMinutes: r.awake_minutes,
    wakeups: r.wakeups,
    bedtime: r.bedtime,
    wakeTime: r.wake_time,
    sleepStages: toStages(r.sleep_stages),
    restingHr: r.resting_hr,
    hrMin: r.hr_min,
    hrMax: r.hr_max,
    // Postgres arrays keep nulls; the generated type does not say so.
    hrHourly: r.hr_hourly as (number | null)[] | null,
    syncedAt: r.synced_at,
  };
}

/** The signed-in user's Health connection, or null when none is connected. */
export async function getConnection(client: TractaClient): Promise<HealthConnection | null> {
  await requireUser(client);
  const row = unwrap(await client.from('health_connections').select('*').maybeSingle());
  return row ? toConnection(row) : null;
}

/** Records the connection after the device granted access. Reconnecting keeps the last sync. */
export async function connect(
  client: TractaClient,
  input: ConnectInput,
): Promise<HealthConnection> {
  const userId = await requireUser(client);
  const c = parse(connectInput, input);
  const row = unwrapOne(
    await client
      .from('health_connections')
      .upsert(
        {
          user_id: userId,
          source: c.source,
          read_types: c.readTypes,
          write_types: c.writeTypes,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single(),
    'health connection',
  );
  return toConnection(row);
}

/** Forgets the connection (the app stops syncing). Synced days stay unless `deleteData`. */
export async function disconnect(
  client: TractaClient,
  options: { deleteData?: boolean } = {},
): Promise<void> {
  const userId = await requireUser(client);
  unwrap(await client.from('health_connections').delete().eq('user_id', userId));
  if (options.deleteData) await deleteHealthData(client);
}

/** Deletes every synced health day (steps also leave the friends' feed). */
export async function deleteHealthData(client: TractaClient): Promise<void> {
  const userId = await requireUser(client);
  unwrap(await client.from('health_days').delete().eq('user_id', userId));
}

/** Upserts the given days (replacing stored ones) and returns the sync instant. */
export async function syncDays(client: TractaClient, input: SyncInput): Promise<string> {
  await requireUser(client);
  const s = parse(syncInput, input);
  const days = s.days.map((d) => ({
    day: d.day,
    steps: d.steps ?? null,
    distance_m: d.distanceM ?? null,
    active_kcal: d.activeKcal ?? null,
    rest_kcal: d.restKcal ?? null,
    active_minutes: d.activeMinutes ?? null,
    intense_minutes: d.intenseMinutes ?? null,
    steps_hourly: d.stepsHourly ?? null,
    sleep_minutes: d.sleepMinutes ?? null,
    in_bed_minutes: d.inBedMinutes ?? null,
    awake_minutes: d.awakeMinutes ?? null,
    wakeups: d.wakeups ?? null,
    bedtime: d.bedtime ?? null,
    wake_time: d.wakeTime ?? null,
    sleep_stages: d.sleepStages ?? null,
    resting_hr: d.restingHr ?? null,
    hr_min: d.hrMin ?? null,
    hr_max: d.hrMax ?? null,
    hr_hourly: d.hrHourly ?? null,
  }));
  const syncedAt = unwrap(
    await client.rpc('upsert_health_days', { p_source: s.source, p_days: days as Json }),
  );
  if (!syncedAt) throw new ApiError('unknown', 'sync returned no timestamp');
  return syncedAt;
}

/** Stored days between two calendar days (inclusive), oldest first. */
export async function listDays(
  client: TractaClient,
  range: z.input<typeof daysRangeInput>,
): Promise<HealthDay[]> {
  await requireUser(client);
  const r = parse(daysRangeInput, range);
  return listOf(
    await client.from('health_days').select('*').gte('day', r.from).lte('day', r.to).order('day'),
  ).map(toDay);
}
