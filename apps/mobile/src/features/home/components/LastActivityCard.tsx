import { useRouter } from 'expo-router';

import { Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';
import { lastActivity } from '../model/home.mock';

/** "Última atividade" with the "Histórico" shortcut. */
export function LastActivityCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  return (
    <Card testID={homeIds.lastCard} px="xl" py="lg">
      <HStack gap="md" justify="space-between">
        <VStack flex={1} gap="xxs">
          <Text variant="caption" color="text2">
            {t('last.title', { when: t('last.when') })}
          </Text>
          <Text variant="cardTitleSm">{lastActivity.details}</Text>
        </VStack>
        <Button
          testID={homeIds.lastHistory}
          label={t('last.history')}
          variant="ghost"
          size="xs"
          onPress={() => router.push('/history')}
        />
      </HStack>
    </Card>
  );
}
