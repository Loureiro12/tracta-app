import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { ReactNode } from 'react';

export type RingProps = MaybeTestable & {
  /** 0..1 */
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: keyof SemanticColors;
  track?: keyof SemanticColors;
  /** Centered content (e.g. "3/4"). */
  children?: ReactNode;
};

/** Progress ring (widgets, rest timer, achievements). */
export function Ring({
  value,
  size = 64,
  strokeWidth = 8,
  color = 'brand',
  track = 'track',
  children,
  testID,
}: RingProps) {
  const theme = useTheme();
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <Box testID={testID} align="center" justify="center" style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors[track]}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={theme.colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
          fill="none"
        />
      </Svg>
      {children}
    </Box>
  );
}

const styles = { svg: { position: 'absolute' } as const };
