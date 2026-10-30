import type { health } from '@/shared/api';

type Day = health.HealthDay;

/** A health metric of the week against the previous week (null = no reading that week). */
export type WeeklyHealth = {
  steps: { average: number | null; changePercent: number | null; goalDays: number };
  sleep: { averageMinutes: number | null; deltaMinutes: number | null; goalNights: number };
  restingHr: { average: number | null; delta: number | null; range: number | null };
  /** Days of the week (Monday–Sunday) with a synced reading. */
  days: number;
};

const mean = (values: number[]): number | null =>
  values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

const valuesOf = (days: Day[], pick: (d: Day) => number | null): number[] =>
  days.map(pick).filter((v): v is number => v !== null);

/** Week vs previous week from synced days; goals are the user's daily steps and sleep minutes. */
export function weeklyHealth(
  week: Day[],
  previous: Day[],
  goals: { steps: number; sleepMinutes: number },
): WeeklyHealth {
  const steps = valuesOf(week, (d) => d.steps);
  const sleep = valuesOf(week, (d) => d.sleepMinutes);
  const hr = valuesOf(week, (d) => d.restingHr);
  const stepsAvg = mean(steps);
  const stepsPrev = mean(valuesOf(previous, (d) => d.steps));
  const sleepAvg = mean(sleep);
  const sleepPrev = mean(valuesOf(previous, (d) => d.sleepMinutes));
  const hrAvg = mean(hr);
  const hrPrev = mean(valuesOf(previous, (d) => d.restingHr));
  return {
    steps: {
      average: stepsAvg === null ? null : Math.round(stepsAvg),
      changePercent:
        stepsAvg !== null && stepsPrev ? Math.round((stepsAvg / stepsPrev - 1) * 100) : null,
      goalDays: steps.filter((v) => v >= goals.steps).length,
    },
    sleep: {
      averageMinutes: sleepAvg === null ? null : Math.round(sleepAvg),
      deltaMinutes:
        sleepAvg !== null && sleepPrev !== null ? Math.round(sleepAvg - sleepPrev) : null,
      goalNights: sleep.filter((v) => v >= goals.sleepMinutes).length,
    },
    restingHr: {
      average: hrAvg === null ? null : Math.round(hrAvg),
      delta: hrAvg !== null && hrPrev !== null ? Math.round(hrAvg - hrPrev) : null,
      range: hr.length ? Math.max(...hr) - Math.min(...hr) : null,
    },
    days: week.length,
  };
}
