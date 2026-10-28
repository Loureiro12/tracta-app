import { StyleSheet } from 'react-native';

import { Box, Dot, Icon, Pressable, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { inboxIds } from '../inbox.testids';

import type { InboxItem } from '../model/inbox.mock';

type InboxItemRowProps = {
  item: InboxItem;
  read: boolean;
  last: boolean;
  onOpen: () => void;
  onRemove: () => void;
};

/** Notification row: letter icon, tappable body (title/description/time), unread dot and remove. */
export function InboxItemRow({ item, read, last, onOpen, onRemove }: InboxItemRowProps) {
  const { t } = useTranslation('inbox');
  return (
    <Box
      testID={`${inboxIds.items}.${item.id}`}
      direction="row"
      gap="md"
      align="flex-start"
      px="lg"
      py="ml"
      borderColor="divider"
      style={last ? styles.rowLast : styles.row}
    >
      <Box bg={item.iconBg} radius="sm" align="center" justify="center" style={styles.icon}>
        <Text variant="secondaryBold" color={item.iconColor}>
          {item.letter}
        </Text>
      </Box>
      <Pressable
        testID={`${inboxIds.items}.${item.id}.open`}
        onPress={onOpen}
        accessibilityLabel={t(`items.${item.id}.title`)}
        style={styles.body}
      >
        <VStack gap="xxs">
          <Text
            testID={`${inboxIds.items}.${item.id}.title`}
            variant={read ? 'bodyMedium' : 'bodyBold'}
          >
            {t(`items.${item.id}.title`)}
          </Text>
          <Text variant="secondary" color="text2">
            {t(`items.${item.id}.description`)}
          </Text>
          <Text variant="caption" color="text3">
            {t(`items.${item.id}.time`)}
          </Text>
        </VStack>
      </Pressable>
      <VStack gap="xs" align="flex-end">
        <Box mt="xs" style={styles.dot}>
          {read ? null : <Dot testID={`${inboxIds.items}.${item.id}.unread`} color="danger" />}
        </Box>
        <Pressable
          testID={`${inboxIds.items}.${item.id}.remove`}
          onPress={onRemove}
          accessibilityLabel={t('remove')}
          style={styles.remove}
        >
          <Icon name="x" size={12} color="text3" />
        </Pressable>
      </VStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: 1 },
  rowLast: { borderBottomWidth: 0 },
  icon: { width: 36, height: 36 },
  body: { flex: 1 },
  dot: { height: 8 },
  remove: {
    width: 32,
    height: 32,
    marginRight: -8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
