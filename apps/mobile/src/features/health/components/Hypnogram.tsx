import { useMemo, useState } from 'react';

import Svg, { Line, Rect } from 'react-native-svg';

import { Box, Text, useTheme } from '@tracta/design-system';

import { SLEEP_STAGE_ROWS } from '../model/health.constants';
import { stageColor } from '../model/health.palette';

import type { SleepStage } from '../model/health.types';

const ROW_H = 22;
const ROW_GAP = 6;
const LABEL_W = 62;
const CHART_H = ROW_H * 4 + ROW_GAP * 3; // 106

/** Start minute of each segment. */
function offsets(segments: readonly (readonly [SleepStage, number])[]) {
  return segments.reduce<{ stage: SleepStage; start: number; min: number }[]>(
    (acc, [stage, min]) => {
      const prev = acc[acc.length - 1];
      acc.push({ stage, start: prev ? prev.start + prev.min : 0, min });
      return acc;
    },
    [],
  );
}

type Props = {
  /** [stage, minutes] in chronological order. */
  segments: readonly (readonly [SleepStage, number])[];
  /** Labels spread under the chart (bedtime … wake-up). */
  axis: readonly string[];
  stageLabel: (stage: SleepStage) => string;
  testID?: string;
};

/** Sleep stages timeline: one row per stage, segments drawn with react-native-svg. */
export function Hypnogram({ segments, axis, stageLabel, testID }: Props) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const chartStyle = useMemo(
    () => ({ height: CHART_H, borderRadius: 6, overflow: 'hidden' as const }),
    [],
  );
  const labelsStyle = useMemo(() => ({ width: LABEL_W, gap: ROW_GAP }), []);
  const rowStyle = useMemo(() => ({ height: ROW_H, justifyContent: 'center' as const }), []);
  const axisStyle = useMemo(() => ({ paddingLeft: LABEL_W + 8 }), []);

  const rects = useMemo(() => {
    const total = Math.max(
      1,
      segments.reduce((a, [, min]) => a + min, 0),
    );
    return offsets(segments).map(({ stage, start, min }) => ({
      stage,
      x: (start / total) * width,
      w: (min / total) * width,
      y: SLEEP_STAGE_ROWS.indexOf(stage) * (ROW_H + ROW_GAP),
    }));
  }, [segments, width]);

  return (
    <Box testID={testID} gap="sm">
      <Box direction="row" gap="sm">
        <Box style={labelsStyle}>
          {SLEEP_STAGE_ROWS.map((stage) => (
            <Box key={stage} style={rowStyle}>
              <Text variant="micro" color="text2">
                {stageLabel(stage)}
              </Text>
            </Box>
          ))}
        </Box>
        <Box flex={1} style={chartStyle} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
            <Svg width={width} height={CHART_H}>
              {[0.25, 0.5, 0.75].map((f) => (
                <Line
                  key={f}
                  x1={width * f}
                  y1={0}
                  x2={width * f}
                  y2={CHART_H}
                  stroke={theme.colors.text}
                  strokeOpacity={0.05}
                  strokeWidth={1}
                />
              ))}
              {rects.map((r, i) => (
                <Rect
                  key={i}
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={ROW_H}
                  rx={4}
                  fill={theme.colors[stageColor(r.stage)]}
                />
              ))}
            </Svg>
          ) : null}
        </Box>
      </Box>
      <Box direction="row" justify="space-between" style={axisStyle}>
        {axis.map((l, i) => (
          <Text key={i} variant="micro" color="text3">
            {l}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
