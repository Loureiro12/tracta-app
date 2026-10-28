import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Dot } from '../Dot/Dot';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ViewStyle } from 'react-native';

export type FloatingBarProps = Testable & {
  title: string;
  subtitle: string;
  actionLabel: string;
  onPress: () => void;
};

/** Mini-player: 58px ink bar with a pulsing live dot and a white action pill. */
export function FloatingBar({ title, subtitle, actionLabel, onPress, testID }: FloatingBarProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      height: 58,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.colors.ink,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      paddingLeft: theme.spacing.lg,
      paddingRight: theme.spacing.sm,
      ...theme.shadows.floating,
    }),
    [theme],
  );
  const pillStyle = useMemo<ViewStyle>(
    () => ({
      height: 42,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.surface,
      justifyContent: 'center',
    }),
    [theme],
  );
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={style}
      accessibilityLabel={`${title}. ${actionLabel}`}
    >
      <Dot color="textOnInk" pulse />
      <Box flex={1} gap="xxs">
        <Text testID={`${testID}.title`} variant="smallBold" color="textOnInk" numberOfLines={1}>
          {title}
        </Text>
        <Text testID={`${testID}.subtitle`} variant="caption" color="textOnInk" numberOfLines={1}>
          {subtitle}
        </Text>
      </Box>
      <Box style={pillStyle}>
        <Text variant="smallBold" color="text">
          {actionLabel}
        </Text>
      </Box>
    </Pressable>
  );
}
