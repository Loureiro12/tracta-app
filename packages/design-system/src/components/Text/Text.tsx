import { useMemo } from 'react';

import { Text as RNText } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { TypographyVariant } from '../../tokens/typography';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

export type TextProps = MaybeTestable &
  Omit<RNTextProps, 'testID' | 'style'> & {
    variant?: TypographyVariant;
    color?: keyof SemanticColors;
    align?: TextStyle['textAlign'];
    uppercase?: boolean;
    /** Tabular figures for timers and stats. */
    tabular?: boolean;
  };

/** Typography primitive. Variants and colors are tokens; no free-form styles. */
export function Text({
  variant = 'body',
  color = 'text',
  align,
  uppercase = false,
  tabular = false,
  children,
  ...rest
}: TextProps) {
  const theme = useTheme();
  const style = useMemo<TextStyle>(
    () => ({
      ...theme.typography[variant],
      color: theme.colors[color],
      textAlign: align,
      textTransform: uppercase ? 'uppercase' : undefined,
      ...(tabular ? { fontVariant: ['tabular-nums'] as TextStyle['fontVariant'] } : {}),
    }),
    [theme, variant, color, align, uppercase, tabular],
  );
  return (
    <RNText style={style} {...rest}>
      {children}
    </RNText>
  );
}

export type HeadingProps = Omit<TextProps, 'variant'> & {
  /** 1 = screen title (30, condensed), 2 = card title (18), 3 = small card title (16). */
  level?: 1 | 2 | 3;
};

/** Semantic heading with accessibility role. */
export function Heading({ level = 1, ...rest }: HeadingProps) {
  const variant: TypographyVariant =
    level === 1 ? 'screenTitle' : level === 2 ? 'cardTitle' : 'cardTitleSm';
  return <Text accessibilityRole="header" variant={variant} {...rest} />;
}
