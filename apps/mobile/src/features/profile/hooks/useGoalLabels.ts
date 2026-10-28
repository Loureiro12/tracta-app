import { formatNumber, useTranslation } from '@/shared/i18n';

import { useProfileStore } from '../model/profile.store';

import type { GoalKey } from '../model/profile.types';

/** Formats each goal the way the handoff shows it ("10.000", "7h 30", "4×", "15 km"). */
export function useGoalLabels(): Record<GoalKey, { short: string; stepper: string }> {
  const { t } = useTranslation('profile');
  const goals = useProfileStore((s) => s.goals);
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
