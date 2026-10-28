import { useMemo } from 'react';

import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../Icon/Icon';
import { Pressable } from '../Pressable/Pressable';
import { Text } from '../Text/Text';

import type { Testable } from '../../testing/test-id';
import type { Theme } from '../../theme/types';
import type { SemanticColors } from '../../tokens/colors';
import type { TypographyVariant } from '../../tokens/typography';
import type { IconName } from '../Icon/Icon';
import type { PressableProps as RNPressableProps, ViewStyle } from 'react-native';

export type ButtonVariant =
  | 'primary' // ink background, white text
  | 'brand' // brand background, white text
  | 'secondary' // fill-1 neutral pill
  | 'surface' // white with hairline outline
  | 'onInk' // white on dark cards
  | 'ghost' // brand text, no background
  | 'danger' // danger background (confirm destructive)
  | 'dangerText'; // white background, danger text (e.g. "Sair")
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'pill' | 'rounded';

export type ButtonProps = Testable & {
  label: string;
  onPress: NonNullable<RNPressableProps['onPress']>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Default: pill for xs/sm/md, rounded (16–18) for lg/xl. */
  shape?: ButtonShape;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  /** Highlighted CTA shadow (handoff: 0 8px 20px). */
  elevated?: boolean;
  accessibilityLabel?: string;
};

type Colors = { bg: string; fg: keyof SemanticColors; border: string };

function resolveColors(theme: Theme, variant: ButtonVariant): Colors {
  const c = theme.colors;
  switch (variant) {
    case 'primary':
      return { bg: c.ink, fg: 'textOnInk', border: c.ink };
    case 'brand':
      return { bg: c.brand, fg: 'textOnBrand', border: c.brand };
    case 'secondary':
      return { bg: c.fill1, fg: 'text', border: c.fill1 };
    case 'surface':
      return { bg: c.surface, fg: 'text', border: c.outline };
    case 'onInk':
      return { bg: c.surface, fg: 'text', border: c.surface };
    case 'ghost':
      return { bg: 'transparent', fg: 'brandText', border: 'transparent' };
    case 'danger':
      return { bg: c.danger, fg: 'textOnBrand', border: c.danger };
    case 'dangerText':
      return { bg: c.surface, fg: 'danger', border: c.surface };
  }
}

const sizeMap: Record<
  ButtonSize,
  { height: number; px: number; variant: TypographyVariant; radius: number }
> = {
  xs: { height: 36, px: 14, variant: 'buttonXs', radius: 18 },
  sm: { height: 40, px: 14, variant: 'buttonSm', radius: 20 },
  md: { height: 50, px: 18, variant: 'button', radius: 25 },
  lg: { height: 56, px: 20, variant: 'buttonLg', radius: 16 },
  xl: { height: 60, px: 20, variant: 'buttonLg', radius: 18 },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  shape,
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  elevated = false,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const theme = useTheme();
  const colors = resolveColors(theme, variant);
  const sizing = sizeMap[size];
  const isInactive = disabled || loading;
  const resolvedShape: ButtonShape = shape ?? (size === 'lg' || size === 'xl' ? 'rounded' : 'pill');

  const containerStyle = useMemo<ViewStyle>(
    () => ({
      backgroundColor: colors.bg,
      borderColor: colors.border,
      borderRadius: resolvedShape === 'pill' ? sizing.height / 2 : sizing.radius,
      height: sizing.height,
      paddingHorizontal: variant === 'ghost' ? 0 : sizing.px,
      alignSelf: fullWidth ? 'stretch' : 'flex-start',
      opacity: isInactive ? 0.5 : 1,
      ...(elevated ? theme.shadows.cta : {}),
    }),
    [colors, theme, sizing, fullWidth, isInactive, resolvedShape, variant, elevated],
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
        <>
          {icon ? <Icon name={icon} size={18} color={colors.fg} /> : null}
          <Text
            testID={`${testID}.label`}
            variant={sizing.variant}
            color={colors.fg}
            align="center"
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
});
