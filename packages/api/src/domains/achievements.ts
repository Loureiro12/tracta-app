/**
 * Gamification reads computed on the server from the user's own logged entries:
 * badges (`achievements`), the month-to-date recap and the Monday–Sunday weekly summary.
 * "Today" / the week start always come from the app clock (YYYY-MM-DD).
 */
import { z } from 'zod';

import { unwrap } from '../errors';
import { listOf, parse, requireUser } from './sessions';

import type { TractaClient } from '../client';

const dateKey = z.iso.date();

/** Badge ids, in display order (the catalog lives in the `achievements` RPC). */
export const BADGE_IDS = [
  'streak12',
  'workouts50',
  'first5k',
  'oneTon',
  'perfectMonth',
  'tenKSub55',
  'streak30',
  'workouts100',
] as const;
export type BadgeId = (typeof BADGE_IDS)[number];

export type Badge = {
  id: BadgeId;
  /** Local day the badge was earned (YYYY-MM-DD); null while locked. */
  earnedOn: string | null;
  /** 0..1 (1 once earned). */
  progress: number;
  /**
   * Value measured so far, in the badge's unit: days (streaks), workouts, metres (first5k),
   * kg (oneTon), weeks of this month (perfectMonth), best 10 km seconds (tenKSub55, null
   * without a 10 km run).
   */
  current: number | null;
  /** Value needed (same unit as `current`). */
  target: number;
};

/** The 8 badges for the user as of `today`. */
export async function getAchievements(client: TractaClient, today: string): Promise<Badge[]> {
  await requireUser(client);
  const rows = listOf(await client.rpc('achievements', { p_today: parse(dateKey, today) }));
  return rows
    .filter((r): r is typeof r & { id: BadgeId } => (BADGE_IDS as readonly string[]).includes(r.id))
    .map((r) => ({
      id: r.id,
      earnedOn: r.earned_on ?? null,
      progress: Number(r.progress),
      current: r.current === null ? null : Number(r.current),
      target: Number(r.target),
    }));
}

const num = z.coerce.number();
const nullableNum = z.union([z.null(), z.coerce.number()]);

const recordSchema = z.object({
  exerciseId: z.string(),
  slug: z.string(),
  name: z.string(),
  /** null for bodyweight exercises. */
  kg: nullableNum,
  reps: num,
  /** Best before this record (kg null when bodyweight or the previous best had no load). */
  previousKg: nullableNum,
  previousReps: num,
  /** Load of the first session of the exercise ("since the start"). */
  firstKg: nullableNum,
  achievedAt: z.string(),
});
export type StrengthRecord = z.output<typeof recordSchema>;

const recapSchema = z.object({
  /** First day of the month (YYYY-MM-DD) and the last day covered (today). */
  month: z.string(),
  to: z.string(),
  workouts: num,
  /** Workouts of the whole previous month. */
  previousWorkouts: num,
  strengthSessions: num,
  runs: num,
  /** 0 = Monday … 6 = Sunday; null without workouts. */
  favoriteWeekday: nullableNum,
  runDistanceM: num,
  runSeconds: num,
  longestRunM: nullableNum,
  /** Fastest 5 consecutive full-km splits of the month. */
  best5kSeconds: nullableNum,
  volumeKg: num,
  sets: num,
  avgStrengthSeconds: nullableNum,
  topFocus: z.string().nullable(),
  /** Exercise with the most volume this month. */
  topExercise: z.string().nullable(),
  /** Consecutive active days ending today (or yesterday). */
  streakDays: num,
  /** Strength records set this month, most recent first (one per exercise). */
  records: z.array(recordSchema),
});
export type MonthlyRecap = z.output<typeof recapSchema>;

/** Recap of the month of `today`, from its first day up to `today`. */
export async function getMonthlyRecap(client: TractaClient, today: string): Promise<MonthlyRecap> {
  await requireUser(client);
  const data = unwrap(await client.rpc('monthly_recap', { p_today: parse(dateKey, today) }));
  return recapSchema.parse(data);
}

const totalsSchema = z.object({
  workouts: num,
  activeSeconds: num,
  runDistanceM: num,
  runSeconds: num,
  volumeKg: num,
});

const weeklySchema = totalsSchema.extend({
  weekStart: z.string(),
  /** Weekly workout goal of the user. */
  goal: num,
  strengthSessions: num,
  /** Runs with a distance. */
  runs: num,
  activeDays: num,
  /** Consecutive active days ending on the week's Sunday (or Saturday). */
  streakDays: num,
  previous: totalsSchema,
  /** Monday → Sunday. `label` is the routine label of the day's first strength session. */
  days: z.array(
    z.object({
      day: z.string(),
      kind: z.enum(['strength', 'run', 'other', 'rest']),
      label: z.string().nullable(),
    }),
  ),
  /** Strength records set during the week, in order. */
  records: z.array(recordSchema),
  longestRun: z
    .object({
      activityId: z.string(),
      distanceM: num,
      day: z.string(),
      longestOfMonth: z.boolean(),
    })
    .nullable(),
});
export type WeeklySummary = z.output<typeof weeklySchema>;
export type WeekDay = WeeklySummary['days'][number];

export const weekStartInput = dateKey.refine((d) => new Date(`${d}T12:00:00Z`).getUTCDay() === 1, {
  message: 'week must start on a Monday',
});

/** Summary of the Monday–Sunday week starting on `weekStart`, vs the week before. */
export async function getWeeklySummary(
  client: TractaClient,
  weekStart: string,
): Promise<WeeklySummary> {
  await requireUser(client);
  const data = unwrap(
    await client.rpc('weekly_summary', { p_week_start: parse(weekStartInput, weekStart) }),
  );
  return weeklySchema.parse(data);
}
