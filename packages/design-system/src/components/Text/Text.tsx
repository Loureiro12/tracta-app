import { useMemo } from 'react';

import { Text as RNText } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { TypographyVariant } from '../../tokens/typography';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

type TextColor = Extract<
  keyof SemanticColors,
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'textOnBrand'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
>;

export type TextProps = MaybeTestable &
  Omit<RNTextProps, 'testID' | 'style'> & {
    variant?: TypographyVariant;
    color?: TextColor;
    align?: TextStyle['textAlign'];
  };

/** Typography primitive. Variants and colors are tokens; no free-form styles. */
export function Text({
  variant = 'bodyMd',
  color = 'textPrimary',
  align,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const style = useMemo<TextStyle>(
    () => ({ ...theme.typography[variant], color: theme.colors[color], textAlign: align }),
    [theme, variant, color, align],
  );
  return (
    <RNText style={style} {...rest}>
      {children}
    </RNText>
  );
}

export type HeadingProps = Omit<TextProps, 'variant'> & {
  level?: 1 | 2 | 3;
};

/** Semantic heading with accessibility role. */
export function Heading({ level = 1, ...rest }: HeadingProps) {
  const variant: TypographyVariant =
    level === 1 ? 'displaySm' : level === 2 ? 'headingLg' : 'headingMd';
  return <Text accessibilityRole="header" variant={variant} {...rest} />;
}
