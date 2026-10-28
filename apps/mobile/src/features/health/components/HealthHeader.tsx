import { Box, Divider, ScreenHeader, Segmented } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { healthIds } from '../health.testids';
import { useHealthStore } from '../model/health.store';

import type { HealthSegment } from '../model/health.types';

const SEGMENTS: readonly HealthSegment[] = ['sleep', 'activity', 'body'];

/** Sticky "Saúde" header with the Sono / Atividade / Corpo segmented control below the title. */
export function HealthHeader() {
  const { t } = useTranslation('health');
  const segment = useHealthStore((s) => s.segment);
  const setSegment = useHealthStore((s) => s.setSegment);
  const options = SEGMENTS.map((value) => ({ value, label: t(`segment.${value}`) }));
  return (
    <Box bg="bg">
      <ScreenHeader testID={healthIds.header} title={t('title')} flat />
      <Box px="screen" pb="md">
        <Segmented
          testID={healthIds.segment}
          options={options}
          value={segment}
          onChange={setSegment}
        />
      </Box>
      <Divider />
    </Box>
  );
}
