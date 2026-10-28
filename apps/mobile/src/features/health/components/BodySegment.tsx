import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, ListGroup, ListRow, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { HAxis } from './BarChart';
import { CardHeader } from './CardHeader';
import { WeightChart } from './WeightChart';
import { healthIds as ids } from '../health.testids';
import { latestMeasures, weightPoints } from '../lib/derive';
import { dec01, dec1 } from '../lib/format';
import { MONTH_AXIS } from '../model/health.mock';
import { useHealthStore } from '../model/health.store';

const MEASURES = ['waist', 'hip', 'arm'] as const;

export function BodySegment() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const bodyLogs = useHealthStore((s) => s.bodyLogs);
  const points = useMemo(() => weightPoints(bodyLogs), [bodyLogs]);
  const measures = useMemo(() => latestMeasures(bodyLogs), [bodyLogs]);
  const last = points[points.length - 1];
  const first = points[0];
  const weight = last?.weight ?? 0;
  const delta = weight - (first?.weight ?? weight);

  return (
    <VStack gap="md">
      <Box testID={ids.bodyHero} gap="xs" py="sm" px="xxs">
        <Text variant="secondary" color="text2">
          {last?.manual ? t('body.sourceManual') : t('body.sourceScale')}
        </Text>
        <Text testID={ids.bodyWeight} variant="heroLg">
          {dec1(weight)}
          <Text variant="nameTitle" color="text2">
            {t('body.unit')}
          </Text>
        </Text>
        <Text variant="small" color="text2">
          {t('body.delta', { sign: delta <= 0 ? '−' : '+', value: dec1(Math.abs(delta)) })}
        </Text>
      </Box>

      <Card testID={ids.bodyChart} gap="sm">
        <CardHeader title={t('body.month')} hint={t('body.count', { count: points.length })} />
        <WeightChart points={points} />
        <HAxis labels={MONTH_AXIS} />
        <Text variant="caption" color="text2">
          {t('body.chartNote')}
        </Text>
      </Card>

      <ListGroup testID={ids.bodyMeasures}>
        {MEASURES.map((key, i) => (
          <ListRow
            key={key}
            testID={`${ids.bodyMeasures}.${key}`}
            label={t(`body.measure.${key}`)}
            description={
              measures.manualToday ? t('body.measure.manualToday') : t('body.measure.manualOld')
            }
            value={t('body.measure.cm', { value: dec01(measures[key]) })}
            last={i === MEASURES.length - 1}
          />
        ))}
      </ListGroup>

      <Button
        testID={ids.bodyRegister}
        label={t('body.register')}
        size="lg"
        fullWidth
        onPress={() => router.push('/health/body-log')}
      />
      <Text variant="caption" color="text2">
        {t('body.footnote')}
      </Text>
    </VStack>
  );
}
