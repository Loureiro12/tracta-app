import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Box, Text, useTheme } from '@tracta/design-system';

import { routePath } from '../model/run.logic';
import { ROUTE_GRID, ROUTE_HEIGHT, ROUTE_WIDTH } from '../model/run.mock';

import type { ViewStyle } from 'react-native';

export type RouteMapProps = {
  /** Portion of the mock loop already covered, 0..1. */
  fraction: number;
  caption: string;
  /** When set, replaces the route with a centered title/subtitle (no-GPS activities). */
  placeholder?: { title: string; subtitle: string; testID: string };
  testID: string;
};

const GRID_X = Array.from(
  { length: Math.ceil(ROUTE_WIDTH / ROUTE_GRID) },
  (_, i) => i * ROUTE_GRID,
);
const GRID_Y = Array.from(
  { length: Math.ceil(ROUTE_HEIGHT / ROUTE_GRID) },
  (_, i) => i * ROUTE_GRID,
);

/** Map placeholder: dotted loop, covered route in brand-text and the current position. */
export function RouteMap({ fraction, caption, placeholder, testID }: RouteMapProps) {
  const theme = useTheme();
  const path = useMemo(() => routePath(fraction), [fraction]);
  const frame = useMemo<ViewStyle>(
    () => ({ height: ROUTE_HEIGHT, borderRadius: theme.radii.card, overflow: 'hidden' }),
    [theme],
  );

  return (
    <Box testID={testID} bg="fill3" style={frame}>
      <Svg viewBox={`0 0 ${ROUTE_WIDTH} ${ROUTE_HEIGHT}`} width="100%" height="100%">
        {GRID_X.map((x) => (
          <Line
            key={`x${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={ROUTE_HEIGHT}
            stroke={theme.colors.divider}
            strokeWidth={1}
          />
        ))}
        {GRID_Y.map((y) => (
          <Line
            key={`y${y}`}
            x1={0}
            y1={y}
            x2={ROUTE_WIDTH}
            y2={y}
            stroke={theme.colors.divider}
            strokeWidth={1}
          />
        ))}
        {placeholder ? null : (
          <>
            <Path
              d={path.full}
              fill="none"
              stroke={theme.colors.dividerStrong}
              strokeWidth={3}
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            <Path
              d={path.drawn}
              fill="none"
              stroke={theme.colors.brandText}
              strokeWidth={4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle
              cx={path.cx}
              cy={path.cy}
              r={11}
              fill={theme.colors.success}
              fillOpacity={0.18}
            />
            <Circle
              cx={path.cx}
              cy={path.cy}
              r={5.5}
              fill={theme.colors.brand}
              stroke={theme.colors.surface}
              strokeWidth={2.5}
            />
          </>
        )}
      </Svg>
      {placeholder ? (
        <Box style={StyleSheet.absoluteFill} align="center" justify="center" gap="xs" p="screen">
          <Text testID={placeholder.testID} variant="cardTitleSm" align="center">
            {placeholder.title}
          </Text>
          <Text variant="secondary" color="text2" align="center">
            {placeholder.subtitle}
          </Text>
        </Box>
      ) : (
        <Box bg="surface" radius="xs" px="sm" py="xs" style={styles.caption}>
          <Text variant="captionSemibold" color="text2" numberOfLines={1}>
            {caption}
          </Text>
        </Box>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  caption: { position: 'absolute', left: 12, bottom: 12 },
});
