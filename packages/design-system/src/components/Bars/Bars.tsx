import { useMemo } from 'react';

import { useTheme } from '../../theme/ThemeProvider';
import { Box } from '../Box/Box';
import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';

export type Bar = {
  value: number;
  color?: keyof SemanticColors | undefined;
  label?: string | undefined;
};

export type BarsProps = MaybeTestable & {
  bars: readonly Bar[];
  /** Chart height in px (bars only). Default 44. */
  height?: number;
  /** Gap between bars. Default 6. */
  gap?: number;
  /** Upper bound; defaults to the max value. */
  max?: number;
  color?: keyof SemanticColors;
  radius?: number;
};

/** Minimal bar chart built from Boxes (sleep nights, steps per hour, 6-month evolution). */
export function Bars({
  bars,
  height = 44,
  gap = 6,
  max,
  color = 'brand',
  radius = 4,
  testID,
}: BarsProps) {
  const theme = useTheme();
  const top = max ?? Math.max(1, ...bars.map((b) => b.value));
  const hasLabels = bars.some((b) => b.label);
  const chartStyle = useMemo(
    () => ({ height, gap, flexDirection: 'row' as const, alignItems: 'flex-end' as const }),
    [height, gap],
  );
  return (
    <Box testID={testID} gap="xs">
      <Box style={chartStyle}>
        {bars.map((bar, i) => (
          <Box
            key={i}
            testID={testID ? `${testID}.bar.${i}` : undefined}
            flex={1}
            style={{
              height: Math.max(2, Math.round((bar.value / top) * height)),
              borderRadius: radius,
              backgroundColor: theme.colors[bar.color ?? color],
            }}
          />
        ))}
      </Box>
      {hasLabels ? (
        <Box direction="row" style={{ gap }}>
          {bars.map((bar, i) => (
            <Text key={i} variant="micro" color="text3" align="center">
              {bar.label ?? ''}
            </Text>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
