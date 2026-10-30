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

import { formatDate, useTranslation } from '@/shared/i18n';

import { useBodyRange } from '../api/useBody';
import { BarChart } from '../components/BarChart';
import { StatCell, StatGrid } from '../components/StatGrid';
import { healthIds as ids } from '../health.testids';
import { useHealthData } from '../hooks/useHealthData';
import {
  addDays,
  keyToDate,
  metricSeries,
  metricStats,
  nightRange,
  sleepAxis,
  sleepWeek,
  weekdayOf,
} from '../lib/derive';
import { dec1, hm, num } from '../lib/format';
import { HOURS_AXIS, METRIC_KEYS } from '../model/health.constants';
import { metricColor } from '../model/health.palette';
import { useHealthStore } from '../model/health.store';

import type { ChartBar } from '../components/BarChart';
import type { MetricContext } from '../lib/derive';
import type { MetricKey, MetricPeriod } from '../model/health.types';

const PERIODS: readonly MetricPeriod[] = ['D', 'W', 'M'];

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

  const data = useHealthData();
  const body = useBodyRange();
  const weights = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of body.data ?? []) if (m.weightKg != null) map.set(m.measuredOn, m.weightKg);
    return map;
  }, [body.data]);
  const { get, todayKey, currentHour, goals, entries } = data;
  const ctx = useMemo<MetricContext>(
    () => ({ get, todayKey, currentHour, goals, weights, entries }),
    [get, todayKey, currentHour, goals, weights, entries],
  );
  const series = useMemo(() => metricSeries(key, period, ctx), [key, period, ctx]);
  const { big, stats } = useMemo(() => metricStats(key, period, ctx), [key, period, ctx]);
  const color = metricColor(key);
  const nn = series.values.filter((v): v is number => v != null);
  const max = Math.max(1, ...nn, series.goal ?? 0) * 1.08;
  const today = get(todayKey);

  const bars: ChartBar[] = series.values.map((v, i) => {
    if (v == null || (series.futureFrom != null && i >= series.futureFrom))
      return { value: v, color: 'fill2' };
    return i === series.highlight ? { value: v, color } : { value: v, color, opacity: 0.4 };
  });

  const shortDate = (k: string) => formatDate(keyToDate(k), { day: 'numeric', month: 'short' });
  const axis =
    period === 'D'
      ? key === 'sleep'
        ? sleepAxis(today)
        : key === 'weight'
          ? []
          : HOURS_AXIS
      : period === 'W'
        ? series.keys.map((k) => t(`weekday.${weekdayOf(k)}`))
        : [0, 10, 20, 29].map((i) => shortDate(addDays(todayKey, i - 29)));

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
  const insightCount = !nn.length
    ? 0
    : key === 'hr'
      ? Math.max(...nn) - Math.min(...nn)
      : key === 'sleep'
        ? nn.filter((v) => v >= goals.sleepMinutes).length
        : nn.filter((v) => v >= goals.steps).length;
  const peakHour = (today?.stepsHourly ?? []).reduce(
    (best, v, i, all) => (v > (all[best] ?? 0) ? i : best),
    0,
  );
  const week = sleepWeek(get, todayKey, goals.sleepMinutes);
  const prevWeek = sleepWeek(get, addDays(todayKey, -7), goals.sleepMinutes);
  const params = {
    count: insightCount,
    time: data.syncTime ?? '—',
    source: data.sourceName,
    total: num((today?.activeKcal ?? 0) + (today?.restKcal ?? 0)),
    night: nightRange(todayKey, formatDate),
    hour: peakHour,
    min: today?.hrMin ?? 0,
    max: today?.hrMax ?? 0,
    slept: hm(today?.sleepMinutes ?? 0),
    goal: hm(goals.sleepMinutes),
    wakeups: today?.wakeups ?? 0,
    avg: key === 'sleep' ? hm(week.avg ?? 0) : num(big ?? 0),
    previous: hm(prevWeek.avg ?? 0),
  };

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
          {big == null ? t('metric.empty') : fmt(big)}
          <Text variant="cardTitle" color="text2">
            {` ${t(`metric.unit.${key}`)}`}
          </Text>
        </Text>
        <Text variant="secondary" color="text2">
          {t(`metric.bigSub.${key}.${period}`, params)}
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
        <Text variant="body">{t(`metric.insight.${key}.${period}`, params)}</Text>
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
            {data.syncTime
              ? t('metric.updated', { time: data.syncTime, source: data.sourceName })
              : t('metric.notSynced')}
          </Text>
        </VStack>
      </ListGroup>
    </Screen>
  );
}
