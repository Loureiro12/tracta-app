import { useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';

import type { Testable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type ScreenProps = Testable & {
  children: ReactNode;
  /** Fixed element above the scrolling content (ScreenHeader / BackHeader). */
  header?: ReactNode;
  /** Fixed element below the content (CTA bars). */
  footer?: ReactNode;
  /** Wrap content in a ScrollView. Default true. */
  scroll?: boolean;
  /** 20px side gutter. Default true. */
  padded?: boolean;
  /** Extra bottom space so content clears the tab bar and mini-player. */
  bottomInset?: 'tab' | 'none';
  bg?: Extract<keyof SemanticColors, 'bg' | 'surface' | 'ink'>;
};

/**
 * Root of every screen: safe area, sand background, optional fixed header/footer and the
 * screen-level testID that E2E flows assert on arrival (`<feature>.screen`).
 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  bottomInset = 'none',
  bg = 'bg',
  testID,
}: ScreenProps) {
  const theme = useTheme();
  const containerStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: theme.colors[bg] }),
    [theme, bg],
  );
  const contentStyle = useMemo<ViewStyle>(
    () => ({
      paddingHorizontal: padded ? theme.spacing.screen : 0,
      paddingTop: theme.spacing.md,
      paddingBottom: bottomInset === 'tab' ? 170 : theme.spacing['2xl'],
      gap: theme.spacing.md,
    }),
    [theme, padded, bottomInset],
  );

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.flex, containerStyle]}
      edges={['top', 'left', 'right']}
    >
      {header}
      {scroll ? (
        <ScrollView
          testID={`${testID}.scroll`}
          style={styles.flex}
          contentContainerStyle={contentStyle}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <Box testID={`${testID}.content`} flex={1} style={contentStyle}>
          {children}
        </Box>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
