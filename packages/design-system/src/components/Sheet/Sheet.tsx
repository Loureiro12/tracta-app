import { useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Button } from '../Button/Button';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

export type SheetProps = Testable & {
  title: string;
  children: ReactNode;
  /** Dismiss handler (backdrop tap and the left/right text buttons). */
  onClose: () => void;
  /** Left text button, e.g. "Cancelar". */
  leftLabel?: string;
  /** Right text button, e.g. "Fechar" / "Salvar". */
  rightLabel?: string;
  onPressRight?: () => void;
  /** Fixed area below the scrolling content (CTAs). */
  footer?: ReactNode;
  /** Max height as a fraction of the screen. Default 0.9. */
  maxHeight?: number;
};

/**
 * Bottom sheet: dimmed backdrop, white panel with 28px top radius, handle and centered title.
 * Render it inside a route presented as `transparentModal`.
 */
export function Sheet({
  title,
  children,
  onClose,
  leftLabel,
  rightLabel,
  onPressRight,
  footer,
  maxHeight = 0.9,
  testID,
}: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const panelStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: theme.radii.sheet,
      borderTopRightRadius: theme.radii.sheet,
      paddingBottom: Math.max(insets.bottom, theme.spacing.lg),
      maxHeight: `${Math.round(maxHeight * 100)}%`,
    }),
    [theme, insets.bottom, maxHeight],
  );
  const handleStyle = useMemo<ViewStyle>(
    () => ({
      width: 36,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.switchOff,
      alignSelf: 'center',
      marginTop: 8,
    }),
    [theme],
  );
  const backdropStyle = useMemo<ViewStyle>(
    () => ({ backgroundColor: theme.colors.overlay }),
    [theme],
  );

  return (
    <Box testID={testID} flex={1} justify="flex-end">
      <Pressable
        testID={`${testID}.backdrop`}
        onPress={onClose}
        style={[StyleSheet.absoluteFill, backdropStyle]}
        pressedOpacity={1}
        accessibilityLabel={title}
      />
      <Box style={panelStyle}>
        <Box style={handleStyle} />
        <Box direction="row" align="center" px="lg" py="md">
          <Box flex={1} align="flex-start">
            {leftLabel ? (
              <Button
                testID={`${testID}.left`}
                label={leftLabel}
                variant="ghost"
                size="sm"
                onPress={onClose}
              />
            ) : null}
          </Box>
          <Text testID={`${testID}.title`} variant="subtitle" align="center" numberOfLines={1}>
            {title}
          </Text>
          <Box flex={1} align="flex-end">
            {rightLabel ? (
              <Button
                testID={`${testID}.right`}
                label={rightLabel}
                variant="ghost"
                size="sm"
                onPress={onPressRight ?? onClose}
              />
            ) : null}
          </Box>
        </Box>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? (
          <Box px="screen" pt="md">
            {footer}
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, gap: 12 },
});
