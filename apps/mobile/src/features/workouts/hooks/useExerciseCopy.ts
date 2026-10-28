import { useCallback } from 'react';

import { useTranslation } from '@/shared/i18n';

import { formatClock, formatKg } from '../model/workouts.helpers';

import type { RoutineExercise } from '../model/workouts.types';

/** Shared, translated one-liners for exercises ("3 × 10 · 60 kg · 1:30"). */
export function useExerciseCopy() {
  const { t } = useTranslation('workouts');

  const load = useCallback(
    (kg: number | null) => (kg == null ? t('copy.bodyweight') : t('copy.kg', { kg: formatKg(kg) })),
    [t],
  );

  /** Builder row summary: "Superset · 3 × 10 · 60 kg · 1:30" / "20 min". */
  const summary = useCallback(
    (e: RoutineExercise) => {
      if (e.cardio) return t('copy.minutes', { count: e.reps });
      const parts = [
        t('copy.setsReps', { sets: e.sets, reps: e.reps }),
        load(e.kg),
        formatClock(e.rest),
      ];
      return (e.superset ? `${t('copy.superset')} · ` : '') + parts.join(' · ');
    },
    [t, load],
  );

  /** Routine detail line: "3 × 10 · 60 kg · descanso 1:30" / "Superset · … · sem descanso". */
  const detailLine = useCallback(
    (e: RoutineExercise) => {
      if (e.cardio) return t('copy.minutes', { count: e.reps });
      const rest =
        e.superset && !e.rest ? t('copy.noRest') : t('copy.rest', { time: formatClock(e.rest) });
      const parts = [t('copy.setsReps', { sets: e.sets, reps: e.reps }), load(e.kg), rest];
      return (e.superset ? `${t('copy.superset')} · ` : '') + parts.join(' · ');
    },
    [t, load],
  );

  return { load, summary, detailLine };
}
