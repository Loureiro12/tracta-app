import { useRouter } from 'expo-router';

import { Box, Card, Divider, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { BarChart } from './BarChart';
import { CardHeader } from './CardHeader';
import { StatCell, StatGrid } from './StatGrid';
import { healthIds as ids } from '../health.testids';
import { dec1, num } from '../lib/format';
import {
  ACTIVE_MINUTES,
  CALORIES,
  CURRENT_HOUR,
  DISTANCE_TODAY_KM,
  HOURS,
  HOURS_AXIS,
  STEPS_GOAL,
  STEPS_TODAY,
  WEEK,
} from '../model/health.mock';

import type { ChartBar } from './BarChart';

const WEEK_AVG = Math.round(WEEK.reduce((a, [v]) => a + v, 0) / WEEK.length);

export function ActivitySegment() {
  const { t } = useTranslation('health');
  const router = useRouter();

  const hourBars: ChartBar[] = HOURS.map((v, i) => ({
    value: v,
    color: i > CURRENT_HOUR ? 'fill1' : i === CURRENT_HOUR ? 'brandText' : 'brandOnDark',
  }));
  const weekBars: ChartBar[] = WEEK.map(([v, d], i) => ({
    value: v,
    color: i === 6 ? 'brandText' : 'brand',
    ...(i === 6 ? {} : { opacity: v >= STEPS_GOAL ? 0.75 : 0.25 }),
    label: t(`weekday.${d}`),
  }));

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
          hint={t('activity.steps.ofGoal', { pct: Math.round((STEPS_TODAY / STEPS_GOAL) * 100) })}
        />
        <Text testID={ids.activityStepsValue} variant="heroLg">
          {num(STEPS_TODAY)}
          <Text variant="cardTitle" color="text2">
            {t('activity.steps.goal', { goal: num(STEPS_GOAL) })}
          </Text>
        </Text>
        <BarChart bars={hourBars} height={76} max={1800} gap={2} radius={2} axis={HOURS_AXIS} />
        <Divider />
        <Text variant="small">{t('activity.steps.insight')}</Text>
      </Card>

      <Card testID={ids.activityWeek}>
        <CardHeader
          title={t('activity.week.title')}
          hint={t('activity.week.avg', { value: num(WEEK_AVG) })}
        />
        <BarChart bars={weekBars} height={110} max={13000} gap={10} goal={STEPS_GOAL} />
        <Divider />
        <Text variant="small">{t('activity.week.insight')}</Text>
      </Card>

      <Card
        testID={ids.activityCalories}
        gap="ml"
        onPress={() => router.push('/health/metric/cal')}
      >
        <CardHeader title={t('activity.calories.title')} hint={t('activity.calories.hint')} />
        {calorieRow(
          t('activity.calories.active'),
          t('activity.calories.activeSub'),
          CALORIES.active,
        )}
        {calorieRow(t('activity.calories.rest'), t('activity.calories.restSub'), CALORIES.rest)}
        <Divider />
        {calorieRow(t('activity.calories.total'), t('activity.calories.totalSub'), CALORIES.total)}
      </Card>

      <Card testID={ids.activityDistance} onPress={() => router.push('/health/metric/dist')}>
        <Text variant="bodySemibold">{t('activity.distance.title')}</Text>
        <StatGrid columns={2} gap="ml">
          <StatCell
            label={t('activity.distance.total')}
            value={t('activity.distance.km', { value: dec1(DISTANCE_TODAY_KM) })}
          />
          <StatCell
            label={t('activity.distance.gps')}
            value={t('activity.distance.none')}
            valueColor="text2"
          />
          <StatCell
            label={t('activity.distance.moving')}
            value={t('activity.distance.min', { value: ACTIVE_MINUTES.moving })}
          />
          <StatCell
            label={t('activity.distance.intense')}
            value={t('activity.distance.min', { value: ACTIVE_MINUTES.intense })}
          />
        </StatGrid>
        <Text variant="caption" color="text2">
          {t('activity.distance.note')}
        </Text>
      </Card>
    </VStack>
  );
}
