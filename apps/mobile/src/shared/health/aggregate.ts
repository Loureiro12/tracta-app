import { toDateKey } from '@/shared/clock';

import type { HealthSource, SleepSession, SleepStage } from './types';
import type { health } from '@tracta/api';

const MINUTE = 60_000;

/** First instant of the local day `days` before `end`'s day, and the first instant after `end`'s day. */
export function lastDaysRange(end: Date, days: number): { from: Date; to: Date } {
  const to = new Date(end);
  to.setHours(0, 0, 0, 0);
  to.setDate(to.getDate() + 1);
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from, to };
}

type NightSummary = {
  sleepMinutes: number;
  inBedMinutes: number;
  awakeMinutes: number;
  wakeups: number;
  bedtime: string;
  wakeTime: string;
  sleepStages: [SleepStage, number][];
};

/** Merges the sessions that ended on one day (naps included) into the night's numbers. */
function summarizeNight(sessions: readonly SleepSession[]): NightSummary | null {
  if (sessions.length === 0) return null;
  const sorted = [...sessions].sort((a, b) => a.start.getTime() - b.start.getTime());
  const segments: [SleepStage, number][] = [];
  let awake = 0;
  let asleep = 0;
  let wakeups = 0;
  for (const s of sorted) {
    for (const st of s.stages) {
      const min = Math.max(0, Math.round((st.end.getTime() - st.start.getTime()) / MINUTE));
      if (min === 0) continue;
      const last = segments[segments.length - 1];
      if (last && last[0] === st.stage) last[1] += min;
      else segments.push([st.stage, min]);
      if (st.stage === 'awake') awake += min;
      else asleep += min;
    }
  }
  for (const [stage] of segments) if (stage === 'awake') wakeups += 1;
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const inBed = sorted.reduce(
    (a, s) => a + Math.round((s.end.getTime() - s.start.getTime()) / MINUTE),
    0,
  );
  // Stores without stages report the whole session as asleep.
  if (segments.length === 0) asleep = inBed;
  return {
    sleepMinutes: Math.min(1440, asleep),
    inBedMinutes: Math.min(1440, Math.max(inBed, asleep + awake)),
    awakeMinutes: Math.min(1440, awake),
    wakeups,
    bedtime: first.start.toISOString(),
    wakeTime: last.end.toISOString(),
    sleepStages: segments,
  };
}

const clampHr = (v: number) => Math.min(250, Math.max(20, Math.round(v)));

/**
 * Reads the last `days` local days from the device and shapes them as the backend's
 * `health.HealthDayInput` (one entry per day that has any reading).
 */
export async function collectHealthDays(
  source: HealthSource,
  end: Date,
  days: number,
): Promise<health.HealthDayInput[]> {
  const range = lastDaysRange(end, days);
  // Sleep that ended on the first day started the evening before.
  const sleepRange = { from: new Date(range.from.getTime() - 12 * 60 * MINUTE), to: range.to };
  const [activity, sleep, hr] = await Promise.all([
    source.readDayActivity(range),
    source.readSleepSessions(sleepRange),
    source.readHeartRate(range),
  ]);

  const byDay = new Map<string, health.HealthDayInput>();
  const entry = (day: string) => {
    let e = byDay.get(day);
    if (!e) {
      e = { day };
      byDay.set(day, e);
    }
    return e;
  };

  for (const a of activity) {
    if (a.steps == null && a.distanceM == null && a.activeKcal == null) continue;
    Object.assign(entry(a.day), {
      steps: a.steps == null ? null : Math.min(200000, Math.round(a.steps)),
      distanceM: a.distanceM == null ? null : Math.round(a.distanceM),
      activeKcal: a.activeKcal == null ? null : Math.round(a.activeKcal),
      restKcal: a.restKcal == null ? null : Math.round(a.restKcal),
      activeMinutes: a.activeMinutes == null ? null : Math.min(1440, Math.round(a.activeMinutes)),
      intenseMinutes:
        a.intenseMinutes == null ? null : Math.min(1440, Math.round(a.intenseMinutes)),
      stepsHourly: a.stepsHourly?.length === 24 ? a.stepsHourly.map((v) => Math.round(v)) : null,
    });
  }

  const nights = new Map<string, SleepSession[]>();
  for (const s of sleep) {
    const key = toDateKey(s.end);
    if (s.end < range.from || s.end >= range.to) continue;
    nights.set(key, [...(nights.get(key) ?? []), s]);
  }
  for (const [day, sessions] of nights) {
    const night = summarizeNight(sessions);
    if (night) Object.assign(entry(day), night);
  }

  const hourly = new Map<string, { sum: number[]; n: number[] }>();
  for (const s of hr.samples) {
    const day = toDateKey(s.at);
    const h = hourly.get(day) ?? { sum: Array(24).fill(0), n: Array(24).fill(0) };
    const hour = s.at.getHours();
    h.sum[hour] += s.bpm;
    h.n[hour] += 1;
    hourly.set(day, h);
  }
  for (const [day, h] of hourly) {
    const values = h.sum.map((sum, i) => (h.n[i] ? clampHr(sum / h.n[i]!) : null));
    const present = values.filter((v): v is number => v != null);
    Object.assign(entry(day), {
      hrHourly: values,
      hrMin: Math.min(...present),
      hrMax: Math.max(...present),
    });
  }
  for (const r of hr.resting) {
    if (byDay.has(r.day) || hourly.has(r.day)) entry(r.day).restingHr = clampHr(r.bpm);
  }
  // Without a resting reading, the lowest hourly average stands in.
  for (const e of byDay.values()) {
    if (e.restingHr == null && e.hrMin != null) e.restingHr = e.hrMin;
  }

  return [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}
