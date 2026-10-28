import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, CheckCircle, Pressable, Text, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { sessionIds } from '../session.testids';

import type { ViewStyle } from 'react-native';

type Props = { index: number; label: string; done: boolean; onToggle: () => void };

/** Dashed warm-up set row (A1, A2…) that never counts toward volume. */
export function WarmupRow({ index, label, done, onToggle }: Props) {
  const { t } = useTranslation('session');
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      minHeight: 46,
      borderRadius: theme.radii.md,
      backgroundColor: done ? theme.colors.warnBg : theme.colors.surface,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: theme.colors.switchOff,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    }),
    [theme, done],
  );
  return (
    <Pressable
      testID={`${sessionIds.warmupRow}.${index}`}
      onPress={onToggle}
      accessibilityLabel={t('warmup.toggle', { n: index + 1 })}
      accessibilityState={{ checked: done }}
      style={style}
    >
      <Box style={styles.num}>
        <Text variant="captionBold" color="warnText">
          {t('warmup.prefix', { n: index + 1 })}
        </Text>
      </Box>
      <Box flex={1}>
        <Text variant="bodySemibold" tabular>
          {label}
        </Text>
      </Box>
      <CheckCircle
        testID={`${sessionIds.warmupRow}.${index}.check`}
        checked={done}
        color="warnText"
        size={26}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  num: { width: 30 },
});
