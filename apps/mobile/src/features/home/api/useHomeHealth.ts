import { dayKeys, sleepScore, sleepWeek, timeOf, useHealthData } from '@/features/health';

/** What the Home cards show from the synced health days (null = no reading). */
export function useHomeHealth() {
  const { get, todayKey, currentHour, goals, connection, syncTime, sourceName } = useHealthData();
  const today = get(todayKey);
  const yesterday = get(dayKeys(todayKey, 2)[0]!);
  const week = sleepWeek(get, todayKey, goals.sleepMinutes);
  const score = sleepScore(get, todayKey, goals.sleepMinutes);

  // "+12% vs. yesterday at this time": needs hourly steps of both days.
  const upTo = (hours: number[] | null | undefined) =>
    hours ? hours.slice(0, currentHour + 1).reduce((a, b) => a + b, 0) : null;
  const nowSteps = upTo(today?.stepsHourly);
  const thenSteps = upTo(yesterday?.stepsHourly);
  const deltaPercent =
    nowSteps != null && thenSteps ? Math.round(((nowSteps - thenSteps) / thenSteps) * 100) : null;

  const restingWeek = dayKeys(todayKey, 7)
    .map((k) => get(k)?.restingHr)
    .filter((v): v is number => v != null);
  const restingAvg = restingWeek.length
    ? restingWeek.reduce((a, b) => a + b, 0) / restingWeek.length
    : null;

  return {
    connected: Boolean(connection),
    syncTime,
    sourceName,
    sleep:
      today?.sleepMinutes == null
        ? null
        : {
            minutes: today.sleepMinutes,
            score: score?.total ?? null,
            bedtime: today.bedtime ? timeOf(today.bedtime) : null,
            wakeTime: today.wakeTime ? timeOf(today.wakeTime) : null,
            regularityMinutes: week.regularity,
            nights: dayKeys(todayKey, 7).map((k) => get(k)?.sleepMinutes ?? 0),
          },
    move:
      today?.steps == null
        ? null
        : {
            steps: today.steps,
            deltaPercent,
            distanceKm: (today.distanceM ?? 0) / 1000,
            activeKcal: today.activeKcal ?? 0,
            activeMinutes: today.activeMinutes ?? 0,
            hours: today.stepsHourly ?? Array<number>(24).fill(0),
            currentHour,
          },
    restingHr:
      today?.restingHr == null
        ? null
        : {
            bpm: today.restingHr,
            deltaFromAverage: restingAvg == null ? 0 : Math.round(restingAvg - today.restingHr),
          },
  };
}
