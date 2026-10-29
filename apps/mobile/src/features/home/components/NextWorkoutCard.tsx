import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useRoutines } from '@/features/workouts';
import { now } from '@/shared/clock';
import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

type NextWorkoutCardProps = { doneToday: boolean };

/** "Hoje · planejado": today's scheduled routine (hidden on days without one). */
export function NextWorkoutCard({ doneToday }: NextWorkoutCardProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  const { data: routines } = useRoutines();
  // Monday = 0 … Sunday = 6, matching routines.weekday
  const weekday = (now().getDay() + 6) % 7;
  const planned = routines?.find((r) => r.day === weekday) ?? null;
  if (!planned) return null;
  return (
    <Card testID={homeIds.nextCard} variant="outline" gap="ml">
      <HStack gap="sm" justify="space-between">
        <Text variant="secondarySemibold">{t('next.eyebrow')}</Text>
        <Text variant="secondarySemibold">
          {t('next.duration', { minutes: planned.estMinutes })}
        </Text>
      </HStack>
      <VStack gap="xxs">
        <Text testID={homeIds.nextTitle} variant="heroMd" numberOfLines={1}>
          {planned.name}
        </Text>
        <Text variant="body">
          {t('next.subtitle', { focus: planned.focus, count: planned.exercises.length })}
        </Text>
      </VStack>
      {doneToday ? (
        <Box testID={homeIds.nextDone} bg="fill2" radius="full" py="ml" align="center">
          <Text variant="button">{t('next.done')}</Text>
        </Box>
      ) : (
        <Button
          testID={homeIds.nextStart}
          label={t('next.start')}
          fullWidth
          onPress={() => router.push({ pathname: '/session', params: { routineId: planned.id } })}
        />
      )}
    </Card>
  );
}
