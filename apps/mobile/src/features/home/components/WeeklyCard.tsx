import { useRouter } from 'expo-router';

import { Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { now } from '@/shared/clock';
import { useTranslation } from '@/shared/i18n';

import { useWeeklySummary } from '../api/useWeeklySummary';
import { homeIds } from '../home.testids';
import { useWeekRange } from '../hooks/useWeekRange';
import { previousWeekStart } from '../lib/week';

/** Dark "Resumo semanal" teaser of the last full week; opens the weekly overlay. */
export function WeeklyCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const weekStart = previousWeekStart(now());
  const range = useWeekRange(weekStart);
  const w = useWeeklySummary(weekStart).data;
  const met = !w || w.workouts >= w.goal;
  const open = () => router.push('/home/weekly');
  return (
    <Card testID={homeIds.weeklyCard} variant="ink" px="xl" py="lg" onPress={open}>
      <HStack gap="md" justify="space-between">
        <VStack flex={1} gap="xxs">
          <Text variant="caption" color="text2OnInk" numberOfLines={1}>
            {t('weekly.eyebrow', { range })}
          </Text>
          <Text testID={homeIds.weeklyHeadline} variant="cardTitle" color="textOnInk">
            {met ? t('weekly.headline') : t('weekly.headlineBelow')}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.homeLine', {
              workouts: t('weekly.homeWorkouts', { count: w?.workouts ?? 0 }),
              records: t('weekly.homeRecords', { count: w?.records.length ?? 0 }),
            })}
          </Text>
        </VStack>
        <Button
          testID={`${homeIds.weeklyCard}.view`}
          label={t('weekly.view')}
          variant="onInk"
          size="xs"
          onPress={open}
        />
      </HStack>
    </Card>
  );
}
