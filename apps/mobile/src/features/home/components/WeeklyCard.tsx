import { useRouter } from 'expo-router';

import { Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

/** Dark "Resumo semanal" teaser; opens the weekly overlay. */
export function WeeklyCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const open = () => router.push('/home/weekly');
  return (
    <Card testID={homeIds.weeklyCard} variant="ink" px="xl" py="lg" onPress={open}>
      <HStack gap="md" justify="space-between">
        <VStack flex={1} gap="xxs">
          <Text variant="caption" color="text2OnInk" numberOfLines={1}>
            {t('weekly.eyebrow', { range: t('weekly.range') })}
          </Text>
          <Text testID={homeIds.weeklyHeadline} variant="cardTitle" color="textOnInk">
            {t('weekly.headline')}
          </Text>
          <Text variant="secondary" color="text2OnInk">
            {t('weekly.homeLine')}
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
