import { StyleSheet } from 'react-native';

import { Box, HStack, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

/** "—— or ——" separator between the e-mail form and the social buttons. */
export function OrDivider() {
  const { t } = useTranslation('auth');
  return (
    <HStack gap="md">
      <Box flex={1} bg="divider" style={styles.line} />
      <Text variant="caption" color="text3">
        {t('or')}
      </Text>
      <Box flex={1} bg="divider" style={styles.line} />
    </HStack>
  );
}

const styles = StyleSheet.create({
  line: { height: 1 },
});
