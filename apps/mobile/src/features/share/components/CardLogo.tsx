import Svg, { Rect } from 'react-native-svg';

import { useTheme } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';

export type CardLogoProps = {
  /** Rounded-square background token (varies with the card style). */
  bg: keyof SemanticColors;
  /** Color of the two first bars; the third is always brand. */
  fg: keyof SemanticColors;
  /** Side in px. Default 22 (card header). */
  size?: number;
};

/** Tracta symbol at card scale: 22px rounded square (r6) with 3 bars (3×5/8/11, gap 2, bottom 6). */
export function CardLogo({ bg, fg, size = 22 }: CardLogoProps) {
  const theme = useTheme();
  const heights = [5, 8, 11];
  const x0 = (22 - (3 * 3 + 2 * 2)) / 2;
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Rect x={0} y={0} width={22} height={22} rx={6} fill={theme.colors[bg]} />
      {heights.map((h, i) => (
        <Rect
          key={i}
          x={x0 + i * 5}
          y={22 - 6 - h}
          width={3}
          height={h}
          rx={1}
          fill={i === 2 ? theme.colors.brand : theme.colors[fg]}
        />
      ))}
    </Svg>
  );
}
