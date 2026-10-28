import { Box, IconButton, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { sessionIds } from '../session.testids';

type Props = {
  subtitle: string;
  elapsed: string;
  paused: boolean;
  onMinimize: () => void;
  onTogglePause: () => void;
};

/** 44 | title + timer | 44 header row of the full-screen session. */
export function SessionHeader({ subtitle, elapsed, paused, onMinimize, onTogglePause }: Props) {
  const { t } = useTranslation('session');
  return (
    <Box direction="row" align="center" px="ml" py="xs" gap="sm">
      <IconButton
        testID={sessionIds.minimize}
        icon="chevron-down"
        label={t('header.minimize')}
        variant="surface"
        size={44}
        onPress={onMinimize}
      />
      <Box flex={1} align="center" gap="xxs">
        <Text variant="secondary" color="text2" numberOfLines={1} align="center">
          {subtitle}
        </Text>
        <Text
          testID={sessionIds.timer}
          variant="nameTitle"
          color={paused ? 'warnText' : 'text'}
          tabular
          numberOfLines={1}
        >
          {elapsed}
        </Text>
      </Box>
      <IconButton
        testID={sessionIds.pause}
        icon={paused ? 'play' : 'pause'}
        label={paused ? t('header.resume') : t('header.pause')}
        variant="surface"
        size={44}
        onPress={onTogglePause}
      />
    </Box>
  );
}
