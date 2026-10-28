import { useCallback } from 'react';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { clock } from '../model/run.logic';

import type { IntervalPhase, ModalityId, Split } from '../model/run.types';

/** Translated labels shared by the live and summary screens. */
export function useRunLabels() {
  const { t } = useTranslation('run');

  const km = useCallback(
    (value: number) => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [],
  );
  const kmh = useCallback(
    (value: number) =>
      t('live.kmh', {
        value: formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      }),
    [t],
  );
  const modality = useCallback((type: ModalityId) => t(`modality.${type}`), [t]);
  const phase = useCallback(
    (p: IntervalPhase) =>
      p.kind === 'work'
        ? t('interval.work', { index: p.index ?? 1, total: p.total ?? 1 })
        : t(`interval.${p.kind}`),
    [t],
  );
  const splitLabel = useCallback(
    (s: Split) =>
      s.km !== null
        ? t('split.km', { n: s.km })
        : t('split.partial', {
            km: formatNumber(s.partialKm ?? 0, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 2,
            }),
          }),
    [t],
  );
  const splitPace = useCallback((s: Split) => t('split.pace', { pace: clock(s.paceSec) }), [t]);

  return { t, km, kmh, modality, phase, splitLabel, splitPace };
}
