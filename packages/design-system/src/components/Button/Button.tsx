import { useMemo } from 'react';

import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { Theme } from '../../theme/types';
import type { TypographyVariant } from '../../tokens/typography';
import type { PressableProps as RNPressableProps, ViewStyle } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = Testable & {
  label: string;
  onPress: NonNullable<RNPressableProps['onPress']>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
};

function resolveColors(theme: Theme, variant: ButtonVariant) {
  switch (variant) {
    case 'primary':
      return { bg: theme.colors.brand, fg: 'textOnBrand' as const, border: theme.colors.brand };
    case 'secondary':
      return {
        bg: theme.colors.surface,
        fg: 'textPrimary' as const,
        border: theme.colors.borderStrong,
      };
    case 'ghost':
      return { bg: 'transparent', fg: 'brand' as const, border: 'transparent' };
    case 'danger':
      return { bg: theme.colors.danger, fg: 'textOnBrand' as const, border: theme.colors.danger };
  }
}

const sizeMap: Record<ButtonSize, { py: number; px: number; variant: TypographyVariant }> = {
  sm: { py: 6, px: 12, variant: 'label' },
  md: { py: 10, px: 16, variant: 'bodyMd' },
  lg: { py: 14, px: 20, variant: 'bodyLg' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const colors = resolveColors(theme, variant);
  const sizing = sizeMap[size];
  const isInactive = disabled || loading;

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderRadius: theme.radii.md,
      paddingVertical: sizing.py,
      paddingHorizontal: sizing.px,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: isInactive ? 0.5 : 1,
    }),
    [colors, theme, sizing, fullWidth, isInactive],
  );

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isInactive}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={[styles.base, containerStyle]}
    >
      {loading ? (
        <ActivityIndicator testID={`${testID}.loading`} color={theme.colors[colors.fg]} />
      ) : (
        <Text testID={`${testID}.label`} variant={sizing.variant} color={colors.fg} align="center">
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
});
