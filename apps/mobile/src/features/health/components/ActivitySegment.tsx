import { useRouter } from 'expo-router';

import { Box, Card, Divider, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { BarChart } from './BarChart';
import { CardHeader } from './CardHeader';
import { StatCell, StatGrid } from './StatGrid';
import { healthIds as ids } from '../health.testids';
import { useHealthData } from '../hooks/useHealthData';
import { dayKeys, weekdayOf } from '../lib/derive';
import { dec1, num } from '../lib/format';
import { HOURS_AXIS } from '../model/health.constants';

import type { ChartBar } from './BarChart';

const HOUR_SCALE = 1800;
const WEEK_SCALE = 13000;

export function ActivitySegment() {
  const { t } = useTranslation('health');
  const router = useRouter();
  const { get, todayKey, currentHour, goals, syncTime, sourceName } = useHealthData();
  const stepsGoal = goals.steps;
  const today = get(todayKey);

  if (today?.steps == null) {
    return (
      <VStack gap="md">
        <Card testID={ids.activitySteps} onPress={() => router.push('/health/metric/steps')}>
          <CardHeader title={t('activity.steps.title')} hint="" />
          <Text testID={ids.activityStepsValue} variant="heroLg">
            —
          </Text>
          <Text variant="small" color="text2">
            {t('activity.empty')}
          </Text>
        </Card>
      </VStack>
    );
  }

  const steps = today.steps;
  const hours = today.stepsHourly ?? Array<number>(24).fill(0);
  const peakHour = hours.reduce((best, v, i) => (v > (hours[best] ?? 0) ? i : best), 0);
  const weekKeys = dayKeys(todayKey, 7);
  const weekSteps = weekKeys.map((k) => get(k)?.steps ?? null);
  const present = weekSteps.filter((v): v is number => v != null);
  const weekAvg = present.length
    ? Math.round(present.reduce((a, b) => a + b, 0) / present.length)
    : 0;
  const weekHit = present.filter((v) => v >= stepsGoal).length;
  const active = today.activeKcal ?? 0;
  const rest = today.restKcal ?? 0;

  const hourBars: ChartBar[] = hours.map((v, i) => ({
    value: v,
    color: i > currentHour ? 'fill1' : i === currentHour ? 'brandText' : 'brandOnDark',
  }));
  const weekBars: ChartBar[] = weekKeys.map((k, i) => {
    const v = weekSteps[i] ?? null;
    return {
      value: v,
      color: i === 6 ? 'brandText' : 'brand',
      ...(i === 6 ? {} : { opacity: (v ?? 0) >= stepsGoal ? 0.75 : 0.25 }),
      label: t(`weekday.${weekdayOf(k)}`),
    };
  });

  const calorieRow = (label: string, sub: string, value: number) => (
    <HStack justify="space-between" align="flex-start" gap="md">
      <Box flex={1} gap="xxs">
        <Text variant="smallSemibold">{label}</Text>
        <Text variant="caption" color="text2">
          {sub}
        </Text>
      </Box>
      <Text variant="stat">{t('activity.calories.kcal', { value: num(value) })}</Text>
    </HStack>
  );

  return (
    <VStack gap="md">
      <Card testID={ids.activitySteps} onPress={() => router.push('/health/metric/steps')}>
        <CardHeader
          title={t('activity.steps.title')}
          hint={t('activity.steps.ofGoal', { pct: Math.round((steps / stepsGoal) * 100) })}
        />
        <Text testID={ids.activityStepsValue} variant="heroLg">
          {num(steps)}
          <Text variant="cardTitle" color="text2">
            {t('activity.steps.goal', { goal: num(stepsGoal) })}
          </Text>
        </Text>
        <BarChart
          bars={hourBars}
          height={76}
          max={Math.max(HOUR_SCALE, ...hours)}
          gap={2}
          radius={2}
          axis={HOURS_AXIS}
        />
        <Divider />
        <Text variant="small">{t('activity.steps.insight', { hour: peakHour })}</Text>
      </Card>

      <Card testID={ids.activityWeek}>
        <CardHeader
          title={t('activity.week.title')}
          hint={t('activity.week.avg', { value: num(weekAvg) })}
        />
        <BarChart
          bars={weekBars}
          height={110}
          max={Math.max(WEEK_SCALE, ...present)}
          gap={10}
          goal={stepsGoal}
        />
        <Divider />
        <Text variant="small">{t('activity.week.insight', { hit: weekHit })}</Text>
      </Card>

      <Card
        testID={ids.activityCalories}
        gap="ml"
        onPress={() => router.push('/health/metric/cal')}
      >
        <CardHeader
          title={t('activity.calories.title')}
          hint={t('activity.calories.hint', { time: syncTime ?? '—' })}
        />
        {calorieRow(t('activity.calories.active'), t('activity.calories.activeSub'), active)}
        {calorieRow(t('activity.calories.rest'), t('activity.calories.restSub'), rest)}
        <Divider />
        {calorieRow(
          t('activity.calories.total'),
          t('activity.calories.totalSub', { source: sourceName }),
          active + rest,
        )}
      </Card>

      <Card testID={ids.activityDistance} onPress={() => router.push('/health/metric/dist')}>
        <Text variant="bodySemibold">{t('activity.distance.title')}</Text>
        <StatGrid columns={2} gap="ml">
          <StatCell
            label={t('activity.distance.total')}
            value={t('activity.distance.km', { value: dec1((today.distanceM ?? 0) / 1000) })}
          />
          <StatCell
            label={t('activity.distance.gps')}
            value={t('activity.distance.none')}
            valueColor="text2"
          />
          <StatCell
            label={t('activity.distance.moving')}
            value={t('activity.distance.min', { value: today.activeMinutes ?? 0 })}
          />
          <StatCell
            label={t('activity.distance.intense')}
            value={t('activity.distance.min', { value: today.intenseMinutes ?? 0 })}
          />
        </StatGrid>
        <Text variant="caption" color="text2">
          {t('activity.distance.note')}
        </Text>
      </Card>
    </VStack>
  );
}
