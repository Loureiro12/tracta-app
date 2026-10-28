import { useMemo } from 'react';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Card,
  ListGroup,
  ListRow,
  Screen,
  Segmented,
  Text,
  VStack,
} from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { BarChart } from '../components/BarChart';
import { StatCell, StatGrid } from '../components/StatGrid';
import { healthIds as ids } from '../health.testids';
import { metricSeries, metricStats } from '../lib/derive';
import { dec1, hm, num } from '../lib/format';
import { HOURS_AXIS, METRIC_KEYS, METRIC_MONTH_AXIS, SLEEP_GOAL_MIN } from '../model/health.mock';
import { metricColor } from '../model/health.palette';
import { useHealthStore } from '../model/health.store';

import type { ChartBar } from '../components/BarChart';
import type { MetricKey, MetricPeriod } from '../model/health.types';

const PERIODS: readonly MetricPeriod[] = ['D', 'W', 'M'];
const DAYS7 = ['tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon'] as const;

type Props = { metricKey: string | undefined };

function isMetricKey(k: string | undefined): k is MetricKey {
  return METRIC_KEYS.includes(k as MetricKey);
}

/** Full-screen detail for one metric (steps, hr, cal, dist, sleep, weight) with Dia/Semana/Mês. */
export function MetricDetailScreen({ metricKey }: Props) {
  const { t } = useTranslation('health');
  const router = useRouter();
  const key: MetricKey = isMetricKey(metricKey) ? metricKey : 'steps';
  const period = useHealthStore((s) => s.metricPeriod);
  const setPeriod = useHealthStore((s) => s.setMetricPeriod);

  const series = useMemo(() => metricSeries(key, period), [key, period]);
  const { big, stats } = useMemo(() => metricStats(key, period), [key, period]);
  const color = metricColor(key);
  const nn = series.values.filter((v): v is number => v != null);
  const max = Math.max(...nn, series.goal ?? 0) * 1.08;

  const bars: ChartBar[] = series.values.map((v, i) => {
    if (v == null || (series.futureFrom != null && i >= series.futureFrom))
      return { value: v, color: 'fill2' };
    return i === series.highlight ? { value: v, color } : { value: v, color, opacity: 0.4 };
  });

  const axis =
    period === 'D'
      ? key === 'sleep'
        ? ['23:48', '02h', '04h', '07:00']
        : HOURS_AXIS
      : period === 'W'
        ? DAYS7.map((d) => t(`weekday.${d}`))
        : METRIC_MONTH_AXIS;

  const fmt = (v: number) => {
    if (key === 'sleep') return hm(v);
    if (key === 'dist' || key === 'weight') return dec1(v);
    return num(v);
  };
  const statValue = (s: { key: string; value: number; ratioOf?: number }) => {
    if (s.ratioOf != null) return t('metric.stat.ofDays', { hit: s.value, total: s.ratioOf });
    if (s.key === 'peakHour') return t('metric.stat.peakHourValue', { hour: s.value });
    if (s.key === 'gps' && s.value < 0) return t('activity.distance.none');
    if (key === 'hr') return `${num(s.value)} ${t('metric.unit.hr')}`;
    if (key === 'dist') return t('activity.distance.km', { value: dec1(s.value) });
    if (key === 'weight')
      return `${s.value > 0 && s.key === 'change' ? '+' : ''}${dec1(s.value)} ${t('metric.unit.weight')}`;
    return fmt(s.value);
  };
  const insightCount =
    key === 'hr'
      ? Math.max(...nn) - Math.min(...nn)
      : key === 'sleep'
        ? nn.filter((v) => v >= SLEEP_GOAL_MIN).length
        : nn.filter((v) => v >= 10000).length;

  return (
    <Screen
      testID={ids.metricScreen}
      header={
        <BackHeader testID={ids.metricBack} label={t('back')} onPress={() => router.back()} />
      }
    >
      <Box gap="xs">
        <Text variant="secondary" color="text2">
          {t(`metric.source.${key}`)}
        </Text>
        <Text testID={ids.metricTitle} variant="overlayTitle">
          {t(`metric.title.${key}`)}
        </Text>
      </Box>
      <Segmented
        testID={ids.metricPeriod}
        options={PERIODS.map((value) => ({ value, label: t(`metric.period.${value}`) }))}
        value={period}
        onChange={setPeriod}
      />
      <Box gap="xxs">
        <Text testID={ids.metricBig} variant="heroLg">
          {fmt(big)}
          <Text variant="cardTitle" color="text2">
            {` ${t(`metric.unit.${key}`)}`}
          </Text>
        </Text>
        <Text variant="secondary" color="text2">
          {t(`metric.bigSub.${key}.${period}`)}
        </Text>
      </Box>
      <Card testID={ids.metricChart} gap="sm">
        <BarChart
          bars={bars}
          height={130}
          max={max}
          lo={series.lo}
          gap={period === 'M' ? 3 : period === 'W' ? 10 : 2}
          radius={3}
          goal={series.goal}
          axis={axis}
        />
      </Card>
      <StatGrid testID={ids.metricStat} columns={3} gap="sm">
        {stats.map((s) => (
          <Card
            key={s.key}
            testID={`${ids.metricStat}.${s.key}`}
            padding="md"
            radius="lg"
            gap="xxs"
          >
            <StatCell
              label={t(`metric.stat.${s.key}` as 'metric.stat.goal')}
              value={statValue(s)}
            />
          </Card>
        ))}
      </StatGrid>
      <Card testID={ids.metricInsight} px="xl" py="lg">
        <Text variant="body">{t(`metric.insight.${key}.${period}`, { count: insightCount })}</Text>
      </Card>
      <Card px="xl" py="lg" gap="sm">
        <Text variant="bodySemibold">{t('metric.about.title')}</Text>
        <Text variant="small" color="text2">
          {t(`metric.about.${key}`)}
        </Text>
      </Card>
      <ListGroup>
        <ListRow
          testID={`${ids.metricScreen}.source-a`}
          label={t(`metric.sources.${key}.a`)}
          value={t(`metric.sources.${key}.aValue`)}
          valueColor="text2"
        />
        <ListRow
          testID={`${ids.metricScreen}.source-b`}
          label={t(`metric.sources.${key}.b`)}
          value={t(`metric.sources.${key}.bValue`)}
          valueColor="text2"
        />
        <VStack py="md" gap="none">
          <Text variant="caption" color="text2">
            {t('metric.updated')}
          </Text>
        </VStack>
      </ListGroup>
    </Screen>
  );
}
