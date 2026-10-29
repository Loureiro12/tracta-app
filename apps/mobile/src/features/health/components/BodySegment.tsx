import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, Card, ListGroup, ListRow, Text, VStack } from '@tracta/design-system';

import { today } from '@/shared/clock';
import { formatDate, useTranslation } from '@/shared/i18n';

import { HAxis } from './BarChart';
import { CardHeader } from './CardHeader';
import { WeightChart } from './WeightChart';
import { bodyWindow, useBodyRange, useLatestBody } from '../api/useBody';
import { healthIds as ids } from '../health.testids';
import { weightPointsOf } from '../lib/body';
import { dec01, dec1 } from '../lib/format';

const MEASURES = ['waist', 'hip', 'arm'] as const;
const DAY_MS = 86_400_000;

/** "26 out" / "Oct 26" from a YYYY-MM-DD key. */
function shortDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return formatDate(new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1), { day: 'numeric', month: 'short' });
}

/** Corpo: latest weight, 30-day weight chart and the latest tape measures (backend data). */
export function BodySegment() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const range = useBodyRange();
  const latest = useLatestBody();
  const todayKey = today();
  const { from, to } = bodyWindow();
  const points = useMemo(() => weightPointsOf(range.data ?? [], from), [range.data, from]);
  const axis = useMemo(() => {
    const start = Date.parse(`${from}T12:00:00Z`);
    return [0, 15, 29].map((i) =>
      shortDay(new Date(start + i * DAY_MS).toISOString().slice(0, 10)),
    );
  }, [from]);

  if (range.isError || latest.isError) {
    return (
      <Card testID={`${ids.bodyHero}.error`} padding="xl" gap="sm">
        <Text variant="bodySemibold">{t('body.state.errorTitle')}</Text>
        <Button
          testID={`${ids.bodyHero}.error.retry`}
          label={t('body.state.retry')}
          variant="surface"
          size="sm"
          onPress={() => {
            void range.refetch();
            void latest.refetch();
          }}
        />
      </Card>
    );
  }
  if (!range.data || !latest.data) {
    return (
      <Text testID={`${ids.bodyHero}.loading`} variant="secondary" color="text2">
        {t('body.state.loading')}
      </Text>
    );
  }

  const last = points[points.length - 1];
  const first = points[0];
  const weight = latest.data.weight;
  const delta = (last?.weight ?? 0) - (first?.weight ?? last?.weight ?? 0);
  const dateLabel = (day: string) => (day === todayKey ? t('body.today') : shortDay(day));

  return (
    <VStack gap="md">
      <Box testID={ids.bodyHero} gap="xs" py="sm" px="xxs">
        <Text variant="secondary" color="text2">
          {weight
            ? weight.source === 'manual'
              ? t('body.sourceManual', { date: dateLabel(weight.measuredOn) })
              : t('body.sourceScale', { date: dateLabel(weight.measuredOn) })
            : t('body.empty')}
        </Text>
        <Text testID={ids.bodyWeight} variant="heroLg">
          {weight ? dec1(weight.value) : '—'}
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
        <HAxis labels={axis} />
        <Text variant="caption" color="text2">
          {points.length ? t('body.chartNote') : t('body.empty')}
        </Text>
      </Card>

      <ListGroup testID={ids.bodyMeasures}>
        {MEASURES.map((key, i) => {
          const m = latest.data[key];
          return (
            <ListRow
              key={key}
              testID={`${ids.bodyMeasures}.${key}`}
              label={t(`body.measure.${key}`)}
              description={
                !m
                  ? '—'
                  : m.measuredOn === to
                    ? t('body.measure.manualToday')
                    : t('body.measure.manualOld', { date: shortDay(m.measuredOn) })
              }
              value={m ? t('body.measure.cm', { value: dec01(m.value) }) : '—'}
              last={i === MEASURES.length - 1}
            />
          );
        })}
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
