import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';
import type { ViewStyle } from 'react-native';

export type ProgressBarProps = MaybeTestable & {
  /** 0..1 */
  value: number;
  color?: keyof SemanticColors;
  track?: keyof SemanticColors;
  /** Default 6. */
  height?: number;
};

/** Horizontal progress on the handoff's track color. */
export function ProgressBar({
  value,
  color = 'brand',
  track = 'track',
  height = 6,
  testID,
}: ProgressBarProps) {
  const theme = useTheme();
  const pct = Math.max(0, Math.min(1, value));
  const trackStyle = useMemo<ViewStyle>(
    () => ({
      height,
      borderRadius: height / 2,
      backgroundColor: theme.colors[track],
      overflow: 'hidden',
      alignSelf: 'stretch',
    }),
    [theme, track, height],
  );
  const fillStyle = useMemo<ViewStyle>(
    () => ({
      width: `${pct * 100}%`,
      height,
      borderRadius: height / 2,
      backgroundColor: theme.colors[color],
    }),
    [theme, color, height, pct],
  );
  return (
    <Box
      testID={testID}
      style={trackStyle}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
    >
      <Box testID={testID ? `${testID}.fill` : undefined} style={fillStyle} />
    </Box>
  );
}
