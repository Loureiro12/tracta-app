import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, HStack, Text, useTheme } from '@tracta/design-system';

import type { ViewStyle } from 'react-native';

export type GridCell = 'point' | 'none' | 'next' | 'off';
export type GridRow = { id: string; name: string; cells: GridCell[] };

type Props = {
  title: string;
  meta: string;
  rows: GridRow[];
  legend: { point: string; none: string; next: string };
  testID: string;
};

/** Day-by-day grid of the challenge: one row per participant, one cell per day (7 columns). */
export function ChallengeGrid({ title, meta, rows, legend, testID }: Props) {
  const theme = useTheme();
  const cellStyles = useMemo<Record<GridCell, ViewStyle>>(
    () => ({
      point: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand },
      none: { backgroundColor: theme.colors.track, borderColor: theme.colors.track },
      next: { backgroundColor: 'transparent', borderColor: theme.colors.switchOff },
      off: { backgroundColor: 'transparent', borderColor: 'transparent' },
    }),
    [theme],
  );
  return (
    <Box testID={testID} bg="surface" radius="card" px="lg" pt="lg" pb="sm" gap="sm">
      <HStack justify="space-between" gap="sm">
        <Text variant="bodySemibold" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="text2" numberOfLines={1}>
          {meta}
        </Text>
      </HStack>
      {rows.map((row) => (
        <HStack key={row.id} gap="xs" style={styles.row}>
          <Box style={styles.name}>
            <Text variant="captionSemibold" numberOfLines={1}>
              {row.name}
            </Text>
          </Box>
          {row.cells.map((cell, i) => (
            <Box key={i} flex={1} style={[styles.cell, cellStyles[cell]]} />
          ))}
        </HStack>
      ))}
      <HStack gap="ml" pt="xs">
        <HStack gap="xs">
          <Box style={[styles.swatch, cellStyles.point]} />
          <Text variant="micro" color="text2">
            {legend.point}
          </Text>
        </HStack>
        <HStack gap="xs">
          <Box style={[styles.swatch, cellStyles.none]} />
          <Text variant="micro" color="text2">
            {legend.none}
          </Text>
        </HStack>
        <HStack gap="xs">
          <Box style={[styles.swatch, cellStyles.next]} />
          <Text variant="micro" color="text2">
            {legend.next}
          </Text>
        </HStack>
      </HStack>
    </Box>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 30 },
  name: { width: 64 },
  cell: { height: 22, borderRadius: 6, borderWidth: 1.5 },
  swatch: { width: 10, height: 10, borderRadius: 3, borderWidth: 1.5 },
});
