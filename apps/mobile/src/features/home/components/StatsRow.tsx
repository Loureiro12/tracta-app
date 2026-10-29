import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { CardHeaderRow } from './CardHeaderRow';
import { useHomeGoals } from '../api/useHomeAccount';
import { homeIds } from '../home.testids';
import { restingHr } from '../model/home.mock';

type StatsRowProps = { weekDone: number };

/** Two-column row: resting heart rate (opens the metric) and workouts this week with segments. */
export function StatsRow({ weekDone }: StatsRowProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const goals = useHomeGoals();
  const segments = Array.from({ length: goals.workouts }, (_, i) => i < weekDone);

  return (
    <HStack gap="md" align="stretch">
      <Box flex={1}>
        <Card
          testID={homeIds.hrCard}
          padding="lg"
          gap="xs"
          // TODO(health): the metric route is owned by the health feature and may not exist yet.
          onPress={() => router.push('/health/metric/hr' as never)}
        >
          <CardHeaderRow title={t('hr.title')} dot="heart" />
          <HStack gap="xs" align="baseline">
            <Text testID={homeIds.hrValue} variant="heroSm">
              {String(restingHr.bpm)}
            </Text>
            <Text variant="smallSemibold" color="text2">
              {t('hr.unit')}
            </Text>
          </HStack>
          <Text variant="caption" color="text2">
            {t('hr.note', { delta: restingHr.deltaFromAverage })}
          </Text>
        </Card>
      </Box>
      <Box flex={1}>
        <Card testID={homeIds.weekCard} padding="lg" gap="xs">
          <Text variant="secondarySemibold" numberOfLines={1}>
            {t('week.title')}
          </Text>
          <HStack gap="xs" align="baseline">
            <Text testID={homeIds.weekValue} variant="heroSm">
              {String(weekDone)}
            </Text>
            <Text testID={homeIds.weekGoal} variant="smallSemibold" color="text2">
              {t('week.of', { goal: goals.workouts })}
            </Text>
          </HStack>
          <VStack flex={1} justify="flex-end">
            <HStack gap="xs">
              {segments.map((done, i) => (
                <Box key={i} flex={1} bg={done ? 'brandText' : 'track'} style={styles.segment} />
              ))}
            </HStack>
          </VStack>
        </Card>
      </Box>
    </HStack>
  );
}

const styles = StyleSheet.create({
  segment: { height: 6, borderRadius: 3 },
});
