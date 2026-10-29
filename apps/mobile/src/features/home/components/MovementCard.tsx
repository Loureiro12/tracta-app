import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Bars, Box, Card, HStack, ProgressBar, Text, VStack } from '@tracta/design-system';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { CardHeaderRow } from './CardHeaderRow';
import { useHomeGoals } from '../api/useHomeAccount';
import { homeIds } from '../home.testids';
import { movement } from '../model/home.mock';

import type { Bar } from '@tracta/design-system';

const MAX_STEPS_PER_HOUR = 1800;

const hourBars: Bar[] = movement.hours.map((value, i) => ({
  value,
  color:
    i > movement.currentHour ? 'fill1' : i === movement.currentHour ? 'brandText' : 'brandOnDark',
}));

type MovementCardProps = { detailed: boolean };

/** "Movimento": steps vs goal, (detailed) steps per hour, and the distance/calories/minutes grid. */
export function MovementCard({ detailed }: MovementCardProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const goals = useHomeGoals();
  const stats = [
    {
      key: 'distance',
      label: t('move.distance'),
      value: t('move.km', {
        value: formatNumber(movement.distanceKm, { maximumFractionDigits: 1 }),
      }),
    },
    {
      key: 'calories',
      label: t('move.calories'),
      value: t('move.kcal', { value: movement.activeKcal }),
    },
    {
      key: 'activity',
      label: t('move.activity'),
      value: t('move.min', { value: movement.activeMinutes }),
    },
  ];

  return (
    <Card testID={homeIds.moveCard} onPress={() => router.push('/health')}>
      <CardHeaderRow
        title={t('move.title')}
        dot="brand"
        meta={t('move.delta', { percent: movement.deltaPercent })}
      />
      <HStack gap="sm" align="baseline">
        <Text testID={homeIds.moveValue} variant="heroLg">
          {formatNumber(movement.steps)}
        </Text>
        <Text testID={homeIds.moveGoal} variant="secondary" color="text2" numberOfLines={1}>
          {t('move.goal', { goal: formatNumber(goals.steps) })}
        </Text>
      </HStack>
      <ProgressBar value={movement.steps / goals.steps} />
      {detailed ? (
        <Bars
          testID={homeIds.moveBars}
          bars={hourBars}
          max={MAX_STEPS_PER_HOUR}
          height={40}
          gap={2}
          radius={2}
        />
      ) : null}
      <Box testID={homeIds.moveStats} borderColor="divider" pt="xs" style={styles.grid}>
        {stats.map((stat) => (
          <VStack key={stat.key} flex={1} gap="xxs" pt="sm">
            <Text variant="caption" color="text2">
              {stat.label}
            </Text>
            <Text variant="stat" numberOfLines={1}>
              {stat.value}
            </Text>
          </VStack>
        ))}
      </Box>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 8, borderTopWidth: 1 },
});
