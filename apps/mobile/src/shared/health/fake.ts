import { now, toDateKey } from '@/shared/clock';

import type {
  DayActivity,
  HealthRange,
  HealthSource,
  HeartRateData,
  HeartRateSample,
  SleepSession,
  SleepStage,
} from './types';

/**
 * Deterministic Health store for E2E builds (and simulators without the native module).
 * It reproduces the prototype numbers that supabase/seeds/50_health.sql seeds for the demo user,
 * relative to "today" (E2E freezes it at 2026-10-26): 6 842 steps, 4,9 km, 312 kcal, 38 min,
 * resting HR 58, last night 23:48 → 07:00 with 3 wake-ups. Keep both files in sync.
 */

const DAYS = 30;
const MINUTE = 60_000;

function series30(base: number, amp: number, k: number): number[] {
  return Array.from({ length: DAYS }, (_, i) =>
    Math.round(base + amp * Math.sin(i * 1.1 + k) + ((((i + 3) * 977) % 23) - 11) * (amp / 22)),
  );
}

const WEEK = [8420, 11230, 7310, 10450, 12880, 9640, 6842];
const NIGHTS = [412, 445, 398, 470, 488, 455, 410];
const PREV_NIGHTS = [380, 395, 470, 390, 400, 410, 390];
const HR_WEEK = [61, 60, 62, 59, 60, 61, 58];
const CAL_WEEK = [410, 520, 360, 480, 610, 450, 312];
const DIST_WEEK = [6.1, 8.2, 5.3, 7.6, 12.4, 7.0, 4.9];
/** Bedtime in minutes from local midnight (negative = the evening before). */
const BED_WEEK = [-40, -5, -35, 0, 5, -45, -12];
const BED_PREV = [50, -40, 45, -30, 48, -25, 8];
const WAKE_WEEK = [2, 3, 2, 3, 2, 3, 3];
const WAKE_PREV = [2, 3, 2, 3, 2, 3, 2];
const STEPS_30 = series30(9200, 2600, 0);
const CAL_30 = series30(450, 90, 2);
const DIST_30 = series30(7.2, 2.2, 3);
const HR_30 = series30(60, 2.5, 1);

const TODAY_HOURS = [
  0, 0, 0, 0, 0, 0, 120, 640, 820, 310, 260, 410, 980, 540, 380, 620, 1762, 0, 0, 0, 0, 0, 0, 0,
];
const TODAY_HR: readonly (number | null)[] = [
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
const TODAY_STAGES: readonly (readonly [SleepStage, number])[] = [
  ['light', 18],
  ['deep', 42],
  ['light', 30],
  ['rem', 16],
  ['light', 34],
  ['deep', 30],
  ['light', 22],
  ['awake', 6],
  ['rem', 24],
  ['light', 40],
  ['deep', 18],
  ['light', 32],
  ['rem', 28],
  ['light', 30],
  ['awake', 8],
  ['rem', 26],
  ['light', 20],
  ['awake', 8],
];

type FakeDay = {
  date: Date;
  activity: DayActivity;
  bedMin: number;
  stages: readonly (readonly [SleepStage, number])[];
  restingHr: number;
  hr: readonly (number | null)[];
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Night of a past day: asleep blocks split by `wakeups` awake blocks of 7 min. */
function pastStages(sleep: number, wakeups: number): (readonly [SleepStage, number])[] {
  const out: (readonly [SleepStage, number])[] = [];
  const block = Math.floor(sleep / (wakeups + 1));
  for (let w = 0; w <= wakeups; w++) {
    out.push(['light', w === wakeups ? sleep - block * wakeups : block]);
    if (w < wakeups) out.push(['awake', 7]);
  }
  return out;
}

/** Day `i` of the 30-day window (29 = today). */
function fakeDay(i: number, today: Date): FakeDay {
  const date = new Date(today);
  date.setDate(date.getDate() - (DAYS - 1 - i));
  const w = i >= 23 ? i - 23 : null;
  const p = i >= 16 && i < 23 ? i - 16 : null;
  const isToday = i === DAYS - 1;
  const steps = w != null ? WEEK[w]! : STEPS_30[i]!;
  const km = w != null ? DIST_WEEK[w]! : Math.max(2, DIST_30[i]!);
  const active = isToday ? 38 : Math.round(steps / 250);
  const restingHr = w != null ? HR_WEEK[w]! : HR_30[i]!;
  const sleep =
    w != null
      ? NIGHTS[w]!
      : p != null
        ? PREV_NIGHTS[p]!
        : 430 + Math.round(30 * Math.sin(i * 1.3)) + (((i * 53) % 41) - 20);
  const wakeups = w != null ? WAKE_WEEK[w]! : p != null ? WAKE_PREV[p]! : 2 + (i % 2);
  const hr: (number | null)[] = Array.from({ length: 24 }, () => null);
  hr[3] = restingHr - 6;
  hr[17] = restingHr + 44;
  return {
    date,
    activity: {
      day: toDateKey(date),
      steps,
      distanceM: Math.round(km * 1000),
      activeKcal: w != null ? CAL_WEEK[w]! : CAL_30[i]!,
      restKcal: isToday ? 1120 : 1500 + ((i * 29) % 160),
      activeMinutes: active,
      intenseMinutes: isToday ? 12 : Math.round(active / 3),
      stepsHourly: isToday ? [...TODAY_HOURS] : null,
    },
    bedMin: w != null ? BED_WEEK[w]! : p != null ? BED_PREV[p]! : -20 + (((i * 37) % 41) - 20),
    stages: isToday ? TODAY_STAGES : pastStages(sleep, wakeups),
    restingHr,
    hr: isToday ? TODAY_HR : hr,
  };
}

function window(range: HealthRange): FakeDay[] {
  const today = startOfDay(now());
  const days: FakeDay[] = [];
  for (let i = 0; i < DAYS; i++) {
    const d = fakeDay(i, today);
    const end = new Date(d.date);
    end.setDate(end.getDate() + 1);
    if (end > range.from && d.date < range.to) days.push(d);
  }
  return days;
}

function session(d: FakeDay): SleepSession {
  const start = new Date(d.date.getTime() + d.bedMin * MINUTE);
  let cursor = start.getTime();
  const stages = d.stages.map(([stage, min]) => {
    const s = { stage, start: new Date(cursor), end: new Date(cursor + min * MINUTE) };
    cursor += min * MINUTE;
    return s;
  });
  return { start, end: new Date(cursor), stages };
}

function heartRate(d: FakeDay): HeartRateSample[] {
  const out: HeartRateSample[] = [];
  d.hr.forEach((bpm, hour) => {
    if (bpm == null) return;
    const at = new Date(d.date);
    at.setHours(hour, 30, 0, 0);
    out.push({ at, bpm });
  });
  return out;
}

export const fakeHealthSource: HealthSource = {
  kind: 'apple_health',
  isFake: true,
  isAvailable: async () => true,
  requestPermissions: async () => true,
  readDayActivity: async (range) => window(range).map((d) => d.activity),
  readSleepSessions: async (range) => window(range).map(session),
  readHeartRate: async (range): Promise<HeartRateData> => {
    const days = window(range);
    return {
      samples: days.flatMap(heartRate),
      resting: days.map((d) => ({ day: d.activity.day, bpm: d.restingHr })),
    };
  },
  saveWorkout: async () => true,
};
