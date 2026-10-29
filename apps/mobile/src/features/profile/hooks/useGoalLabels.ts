import { formatNumber, useTranslation } from '@/shared/i18n';

import type { GoalKey, Goals } from '../model/profile.types';
import type { Goals as AccountGoals } from '@/shared/api';

/** Account goals (server shape) keyed the way the Profile screens list them. */
export const toGoalValues = (g: AccountGoals): Goals => ({
  steps: g.steps,
  sleep: g.sleepMinutes,
  workouts: g.workoutsPerWeek,
  runKm: g.runKm,
});

/** Back to the server shape for `account.updateGoals`. */
export const toAccountGoals = (g: Goals): AccountGoals => ({
  steps: g.steps,
  sleepMinutes: g.sleep,
  workoutsPerWeek: g.workouts,
  runKm: g.runKm,
});

/** Formats each goal the way the handoff shows it ("10.000", "7h 30", "4×", "15 km"). */
export function useGoalLabels(goals: Goals): Record<GoalKey, { short: string; stepper: string }> {
  const { t } = useTranslation('profile');
  const steps = t('goals.stepsValue', { value: formatNumber(goals.steps) });
  const sleep = t('goals.sleepValue', {
    hours: Math.floor(goals.sleep / 60),
    minutes: String(goals.sleep % 60).padStart(2, '0'),
  });
  return {
    steps: { short: steps, stepper: steps },
    sleep: { short: sleep, stepper: sleep },
    workouts: {
      short: t('goals.workoutsValue', { value: goals.workouts }),
      stepper: t('goals.workoutsTimes', { value: goals.workouts }),
    },
    runKm: {
      short: t('goals.runKmValue', { value: goals.runKm }),
      stepper: t('goals.runKmValue', { value: goals.runKm }),
    },
  };
}
