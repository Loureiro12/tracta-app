import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';
import { nextWorkout } from '../model/home.mock';

type NextWorkoutCardProps = { doneToday: boolean };

/** "Hoje · planejado": outlined card with the routine name and the start CTA. */
export function NextWorkoutCard({ doneToday }: NextWorkoutCardProps) {
  const router = useRouter();
  const { t } = useTranslation('home');
  return (
    <Card testID={homeIds.nextCard} variant="outline" gap="ml">
      <HStack gap="sm" justify="space-between">
        <Text variant="secondarySemibold">{t('next.eyebrow')}</Text>
        <Text variant="secondarySemibold">
          {t('next.duration', { minutes: nextWorkout.minutes })}
        </Text>
      </HStack>
      <VStack gap="xxs">
        <Text testID={homeIds.nextTitle} variant="heroMd" numberOfLines={1}>
          {nextWorkout.name}
        </Text>
        <Text variant="body">
          {t('next.subtitle', { focus: nextWorkout.focus, count: nextWorkout.exercises })}
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
          onPress={() => router.push('/session')}
        />
      )}
    </Card>
  );
}
