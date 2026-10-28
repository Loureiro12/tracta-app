import { StyleSheet } from 'react-native';

import { Box, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

/** Tiny ink "PR" tag next to a record set or session. */
export function PrTag({ testID }: { testID?: string }) {
  const { t } = useTranslation('history');
  return (
    <Box testID={testID} bg="ink" style={styles.tag}>
      <Text variant="microBold" color="textOnInk">
        {t('evo.pr')}
      </Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
});
