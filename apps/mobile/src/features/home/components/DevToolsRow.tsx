import { useRouter } from 'expo-router';

import { Button, HStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

/** Dev/E2E-only shortcuts at the end of the Home scroll (Settings and the design-system gallery). */
export function DevToolsRow() {
  const router = useRouter();
  const { t } = useTranslation('home');
  return (
    <HStack gap="md" justify="center">
      <Button
        testID={homeIds.goToSettings}
        label={t('nav.settings')}
        variant="ghost"
        size="xs"
        onPress={() => router.push('/settings')}
      />
      <Button
        testID={homeIds.goToDesignSystem}
        label={t('nav.designSystem')}
        variant="ghost"
        size="xs"
        onPress={() => router.push('/design-system')}
      />
    </HStack>
  );
}
