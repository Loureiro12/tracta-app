import { useMemo } from 'react';

import { View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { RadiusToken } from '../../tokens/radii';
import type { ShadowToken } from '../../tokens/shadows';
import type { SpacingToken } from '../../tokens/spacing';
import type { ReactNode } from 'react';
import type { StyleProp, ViewProps, ViewStyle } from 'react-native';

type MutableViewStyle = { -readonly [K in keyof ViewStyle]: ViewStyle[K] };

export type BoxProps = MaybeTestable &
  Omit<ViewProps, 'testID' | 'style'> & {
    children?: ReactNode;
    /** Semantic background color token. */
    bg?: keyof SemanticColors;
    borderColor?: keyof SemanticColors;
    borderWidth?: number;
    radius?: RadiusToken;
    shadow?: ShadowToken;
    p?: SpacingToken;
    px?: SpacingToken;
    py?: SpacingToken;
    pt?: SpacingToken;
    pb?: SpacingToken;
    pl?: SpacingToken;
    pr?: SpacingToken;
    m?: SpacingToken;
    mx?: SpacingToken;
    my?: SpacingToken;
    mt?: SpacingToken;
    mb?: SpacingToken;
    gap?: SpacingToken;
    flex?: ViewStyle['flex'];
    direction?: ViewStyle['flexDirection'];
    align?: ViewStyle['alignItems'];
    justify?: ViewStyle['justifyContent'];
    wrap?: ViewStyle['flexWrap'];
    /** Escape hatch for layout-only overrides. Colors and spacing must come from props. */
    style?: StyleProp<ViewStyle>;
  };

/**
 * The base layout primitive. All spacing, color and radius values are tokens.
 */
export function Box({
  bg,
  borderColor,
  borderWidth,
  radius,
  shadow,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  gap,
  flex,
  direction,
  align,
  justify,
  wrap,
  style,
  ...rest
}: BoxProps) {
  const theme = useTheme();

  const computed = useMemo<ViewStyle>(() => {
    const s: MutableViewStyle = {};
    if (bg) s.backgroundColor = theme.colors[bg];
    if (borderColor) s.borderColor = theme.colors[borderColor];
    if (borderWidth !== undefined) s.borderWidth = borderWidth;
    if (radius) s.borderRadius = theme.radii[radius];
    if (p) s.padding = theme.spacing[p];
    if (px) s.paddingHorizontal = theme.spacing[px];
    if (py) s.paddingVertical = theme.spacing[py];
    if (pt) s.paddingTop = theme.spacing[pt];
    if (pb) s.paddingBottom = theme.spacing[pb];
    if (pl) s.paddingLeft = theme.spacing[pl];
    if (pr) s.paddingRight = theme.spacing[pr];
    if (m) s.margin = theme.spacing[m];
    if (mx) s.marginHorizontal = theme.spacing[mx];
    if (my) s.marginVertical = theme.spacing[my];
    if (mt) s.marginTop = theme.spacing[mt];
    if (mb) s.marginBottom = theme.spacing[mb];
    if (gap) s.gap = theme.spacing[gap];
    if (flex !== undefined) s.flex = flex;
    if (direction) s.flexDirection = direction;
    if (align) s.alignItems = align;
    if (justify) s.justifyContent = justify;
    if (wrap) s.flexWrap = wrap;
    return shadow ? { ...theme.shadows[shadow], ...s } : s;
  }, [
    theme,
    bg,
    borderColor,
    borderWidth,
    radius,
    shadow,
    p,
    px,
    py,
    pt,
    pb,
    pl,
    pr,
    m,
    mx,
    my,
    mt,
    mb,
    gap,
    flex,
    direction,
    align,
    justify,
    wrap,
  ]);

  return <View style={[computed, style]} {...rest} />;
}
