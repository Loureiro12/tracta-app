import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ViewStyle } from 'react-native';

export type ToastProps = Testable & {
  message: string;
};

/** Ink pill toast (14/600) with the handoff's soft shadow. Position it with a parent. */
export function Toast({ message, testID }: ToastProps) {
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.ink,
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      alignSelf: 'center',
      ...theme.shadows.toast,
    }),
    [theme],
  );
  return (
    <Box
      testID={testID}
      style={style}
      accessible
      accessibilityLabel={message}
      accessibilityLiveRegion="polite"
    >
      <Text
        testID={`${testID}.message`}
        variant="smallSemibold"
        color="textOnInk"
        numberOfLines={1}
      >
        {message}
      </Text>
    </Box>
  );
}
