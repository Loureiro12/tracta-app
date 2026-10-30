import type { health } from '@/shared/api';

export type SleepRecap = {
  /** Average sleep per night with data this month, in minutes (null = no data). */
  averageMinutes: number | null;
  /** Against the previous month's average (null = nothing to compare). */
  deltaMinutes: number | null;
  nightsOnTarget: number;
  nights: number;
  /** Average bedtime "HH:MM" in local time (null = no data). */
  bedtime: string | null;
};

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

/** Minutes after noon of a local instant, so bedtimes around midnight average correctly. */
function minutesFromNoon(iso: string): number {
  const d = new Date(iso);
  return (d.getHours() * 60 + d.getMinutes() + 720) % 1440;
}

/** Sleep story of the recap: `month` days against `previous` days, goal in minutes per night. */
export function sleepRecap(
  month: health.HealthDay[],
  previous: health.HealthDay[],
  goalMinutes: number,
): SleepRecap {
  const nights = month.map((d) => d.sleepMinutes).filter((v): v is number => v !== null);
  const avg = mean(nights);
  const prev = mean(previous.map((d) => d.sleepMinutes).filter((v): v is number => v !== null));
  const bed = mean(
    month
      .map((d) => d.bedtime)
      .filter((v): v is string => v !== null)
      .map(minutesFromNoon),
  );
  const bedMinutes = bed === null ? null : (Math.round(bed) + 720) % 1440;
  return {
    averageMinutes: avg === null ? null : Math.round(avg),
    deltaMinutes: avg !== null && prev !== null ? Math.round(avg - prev) : null,
    nightsOnTarget: nights.filter((v) => v >= goalMinutes).length,
    nights: nights.length,
    bedtime:
      bedMinutes === null
        ? null
        : `${String(Math.floor(bedMinutes / 60)).padStart(2, '0')}:${String(bedMinutes % 60).padStart(2, '0')}`,
  };
}
