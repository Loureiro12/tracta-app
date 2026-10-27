import { useRouter } from 'expo-router';

import { Button, Heading, Screen, Text, VStack } from '@tracta/design-system';

import { env } from '@/shared/config/env';
import { useTranslation } from '@/shared/i18n';

import { Counter } from '../components/Counter';
import { homeIds } from '../home.testids';

export function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation(['home', 'common']);
  return (
    <Screen testID={homeIds.screen}>
      <Heading testID={homeIds.title}>{t('common:appName')}</Heading>
      <Text color="textSecondary">{t('home:subtitle')}</Text>
      <Counter />
      <VStack gap="sm">
        <Button
          testID={homeIds.goToSettings}
          label={t('home:nav.settings')}
          variant="secondary"
          onPress={() => router.push('/settings')}
        />
        {env.showDevTools ? (
          <Button
            testID={homeIds.goToDesignSystem}
            label={t('home:nav.designSystem')}
            variant="ghost"
            onPress={() => router.push('/design-system')}
          />
        ) : null}
      </VStack>
    </Screen>
  );
}
