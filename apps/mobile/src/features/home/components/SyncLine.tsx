import { Dot, HStack, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { useHomeHealth } from '../api/useHomeHealth';
import { homeIds } from '../home.testids';

/** "Apple Health · sincronizado às 16:12" with a status dot (green once synced). */
export function SyncLine() {
  const { t } = useTranslation('home');
  const { connected, syncTime, sourceName } = useHomeHealth();
  const text = !connected
    ? t('sync.off')
    : syncTime
      ? t('sync.line', { source: sourceName, time: syncTime })
      : t('sync.never', { source: sourceName });
  return (
    <HStack gap="sm">
      <Dot color={connected && syncTime ? 'success' : 'text3'} size={6} />
      <Text testID={homeIds.syncLine} variant="caption" color="text2">
        {text}
      </Text>
    </HStack>
  );
}
