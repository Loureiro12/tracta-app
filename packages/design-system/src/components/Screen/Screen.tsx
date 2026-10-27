import { useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';

import type { Testable } from '../../testing/test-id';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type ScreenProps = Testable & {
  children: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** Horizontal padding token applied to the content. */
  padded?: boolean;
};

/**
 * Root of every screen. Provides safe area, background and the screen-level testID
 * that E2E flows assert on arrival (`<feature>.screen`).
 */
export function Screen({ children, scroll = true, padded = true, testID }: ScreenProps) {
  const theme = useTheme();
  const containerStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: theme.colors.background }),
    [theme],
  );
  const contentStyle = useMemo<ViewStyle>(
    () => ({ padding: padded ? theme.spacing.lg : 0, gap: theme.spacing.lg }),
    [theme, padded],
  );

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.flex, containerStyle]}
      edges={['top', 'left', 'right']}
    >
      {scroll ? (
        <ScrollView
          testID={`${testID}.scroll`}
          style={styles.flex}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <Box testID={`${testID}.content`} flex={1} style={contentStyle}>
          {children}
        </Box>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
