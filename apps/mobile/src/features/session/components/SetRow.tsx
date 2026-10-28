import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, CheckCircle, Pressable, Text, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { sessionIds } from '../session.testids';

import type { ViewStyle } from 'react-native';

type Props = {
  index: number;
  summary: string;
  previous: string;
  done: boolean;
  onToggle: () => void;
};

/** Collapsed set row: number · summary · previous · check. White when done, transparent otherwise. */
export function SetRow({ index, summary, previous, done, onToggle }: Props) {
  const { t } = useTranslation('session');
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      minHeight: 52,
      borderRadius: theme.radii.lg,
      backgroundColor: done ? theme.colors.surface : 'transparent',
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    }),
    [theme, done],
  );
  return (
    <Pressable
      testID={`${sessionIds.setRow}.${index}`}
      onPress={onToggle}
      accessibilityLabel={t('set.toggle', { num: index + 1 })}
      accessibilityState={{ checked: done }}
      style={style}
    >
      <Box style={styles.num}>
        <Text variant="secondaryBold" color="text2" tabular>
          {String(index + 1)}
        </Text>
      </Box>
      <Box flex={1}>
        <Text variant="cardTitleSm" color={done ? 'text' : 'text2'} tabular numberOfLines={1}>
          {summary}
        </Text>
      </Box>
      <Text variant="caption" color="text3">
        {previous}
      </Text>
      <CheckCircle
        testID={`${sessionIds.setRow}.${index}.check`}
        checked={done}
        color="ink"
        size={28}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  num: { width: 30 },
});
