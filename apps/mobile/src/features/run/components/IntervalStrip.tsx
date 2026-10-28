import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Text, useTheme } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

export type IntervalStripProps = {
  label: string;
  remaining: string;
  /** 0..1 */
  progress: number;
  tone: keyof SemanticColors;
  next: string;
  testID: string;
};

/** Colored band with the current interval phase, time left and the next block. */
export function IntervalStrip({
  label,
  remaining,
  progress,
  tone,
  next,
  testID,
}: IntervalStripProps) {
  const theme = useTheme();
  const fill = useMemo<ViewStyle>(
    () => ({
      width: `${Math.round(Math.max(0, Math.min(1, progress)) * 100)}%`,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.textOnInk,
    }),
    [theme, progress],
  );
  return (
    <Box testID={testID} bg={tone} radius="xl" px="lg" py="ml" gap="sm">
      <Box direction="row" justify="space-between" align="baseline" gap="sm">
        <Text testID={`${testID}.label`} variant="cardTitle" color="textOnInk" numberOfLines={1}>
          {label}
        </Text>
        <Text testID={`${testID}.remaining`} variant="heroMd" color="textOnInk" tabular>
          {remaining}
        </Text>
      </Box>
      <Box style={styles.track}>
        <Box bg="textOnInk" style={styles.trackBg} />
        <Box style={fill} />
      </Box>
      <Text testID={`${testID}.next`} variant="caption" color="text2OnInk">
        {next}
      </Text>
    </Box>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.25 },
});
