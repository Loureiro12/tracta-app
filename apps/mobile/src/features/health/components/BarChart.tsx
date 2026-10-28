import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import Svg, { Line } from 'react-native-svg';

import { Box, Text, useTheme } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';

export type ChartBar = {
  value: number | null;
  color: keyof SemanticColors;
  /** Lighter variants of the same hue (the handoff's `#A9ABEB`, `COL+'66'`…). */
  opacity?: number;
  label?: string;
};

const MIN_H = 3;
const FULL = 1;

type Props = {
  bars: readonly ChartBar[];
  /** Chart height in px (bars only). */
  height: number;
  /** Upper bound of the scale. */
  max: number;
  /** Lower bound (heart rate starts at 40). */
  lo?: number;
  gap?: number;
  radius?: number;
  /** Dashed horizontal line at this value. */
  goal?: number | null;
  goalLabel?: string;
  /** Evenly spread labels under the chart (space-between). */
  axis?: readonly string[];
  testID?: string;
};

/**
 * Bar chart with per-bar colors/opacity, an optional dashed goal line and either
 * per-bar labels or an evenly spaced axis. Heights follow the prototype: value / max × height.
 */
export function BarChart({
  bars,
  height,
  max,
  lo = 0,
  gap = 6,
  radius = 6,
  goal = null,
  goalLabel,
  axis,
  testID,
}: Props) {
  const theme = useTheme();
  const range = Math.max(1, max - lo);
  const chartStyle = useMemo(
    () => ({ height, gap, flexDirection: 'row' as const, alignItems: 'flex-end' as const }),
    [height, gap],
  );
  const labelsStyle = useMemo(() => ({ gap }), [gap]);
  const goalBottom = goal == null ? null : Math.round(((goal - lo) / range) * height);
  const goalStyle = useMemo(
    () => (goalBottom == null ? null : { bottom: goalBottom, height: 1 }),
    [goalBottom],
  );
  const goalLabelStyle = useMemo(
    () => (goalBottom == null ? null : { bottom: goalBottom + 3 }),
    [goalBottom],
  );
  const hasLabels = bars.some((b) => b.label);

  return (
    <Box testID={testID} gap="sm">
      <Box style={chartStyle}>
        {goalStyle ? (
          <Box pointerEvents="none" style={[styles.goal, goalStyle]}>
            <Svg width="100%" height={1}>
              <Line
                x1="0"
                y1="0.5"
                x2="100%"
                y2="0.5"
                stroke={theme.colors.text}
                strokeOpacity={0.35}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
            </Svg>
          </Box>
        ) : null}
        {goalLabel && goalLabelStyle ? (
          <Box pointerEvents="none" style={[styles.goalLabel, goalLabelStyle]}>
            <Text variant="micro" color="text2">
              {goalLabel}
            </Text>
          </Box>
        ) : null}
        {bars.map((bar, i) => {
          const h =
            bar.value == null
              ? MIN_H
              : Math.max(MIN_H, Math.round(((bar.value - lo) / range) * height));
          const opacity = bar.opacity ?? FULL;
          return (
            <Box
              key={i}
              flex={1}
              style={{
                height: h,
                borderRadius: radius,
                backgroundColor: theme.colors[bar.color],
                opacity,
              }}
            />
          );
        })}
      </Box>
      {hasLabels ? (
        <Box direction="row" style={labelsStyle}>
          {bars.map((bar, i) => (
            <Box key={i} flex={1}>
              <Text variant="micro" color="text2" align="center">
                {bar.label ?? ''}
              </Text>
            </Box>
          ))}
        </Box>
      ) : null}
      {axis ? <HAxis labels={axis} /> : null}
    </Box>
  );
}

/** Evenly spread axis labels (11px, text3). */
export function HAxis({ labels }: { labels: readonly string[] }) {
  return (
    <Box direction="row" justify="space-between">
      {labels.map((l, i) => (
        <Text key={i} variant="micro" color="text3">
          {l}
        </Text>
      ))}
    </Box>
  );
}

const styles = StyleSheet.create({
  goal: { position: 'absolute', left: 0, right: 0 },
  goalLabel: { position: 'absolute', right: 0 },
});
