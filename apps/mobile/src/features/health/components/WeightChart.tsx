import Svg, { Circle, Line, Path } from 'react-native-svg';

import { Box, useTheme } from '@tracta/design-system';

import { weightChart } from '../lib/derive';

import type { WeightPoint } from '../lib/derive';

type Props = { points: readonly WeightPoint[]; testID?: string };

const VB_W = 310;
const VB_H = 120;

/** 30-day weight line with a soft trend band behind it (viewBox 310×120 from the prototype). */
export function WeightChart({ points, testID }: Props) {
  const theme = useTheme();
  const { line, trend, cx, cy } = weightChart(points);
  return (
    <Box testID={testID}>
      <Svg width="100%" height={VB_H} viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none">
        {[20, 65, 110].map((y) => (
          <Line
            key={y}
            x1={0}
            y1={y}
            x2={VB_W}
            y2={y}
            stroke={theme.colors.text}
            strokeOpacity={0.06}
            strokeWidth={1}
          />
        ))}
        <Path
          d={trend}
          fill="none"
          stroke={theme.colors.success}
          strokeOpacity={0.35}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Path
          d={line}
          fill="none"
          stroke={theme.colors.brandText}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Circle
          cx={cx}
          cy={cy}
          r={5}
          fill={theme.colors.brand}
          stroke={theme.colors.surface}
          strokeWidth={3}
        />
      </Svg>
    </Box>
  );
}
