import { Dot, HStack, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';
import { HEALTH_SYNC_TIME } from '../model/home.mock';

/** "Apple Health · sincronizado às 16:12" with a green status dot. */
export function SyncLine() {
  const { t } = useTranslation('home');
  return (
    <HStack gap="sm">
      <Dot color="success" size={6} />
      <Text testID={homeIds.syncLine} variant="caption" color="text2">
        {t('sync.line', { time: HEALTH_SYNC_TIME })}
      </Text>
    </HStack>
  );
}
