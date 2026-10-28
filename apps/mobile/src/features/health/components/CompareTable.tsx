import { useMemo } from 'react';

import { Box, Text, useTheme } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';

export type CompareRow = {
  key: string;
  label: string;
  delta: string;
  deltaColor: keyof SemanticColors;
  a: string;
  b: string;
};

type Props = {
  columnA: string;
  columnB: string;
  rows: readonly CompareRow[];
  /** Flex of the label column (prototype: 1.2 or 1.3). */
  labelFlex?: number;
  /** Row vertical padding token. */
  rowPy?: 'sm' | 'md';
  note?: string;
  testID?: string;
};

/** Three-column comparison (label + delta · value A · value B) with hairlines between rows. */
export function CompareTable({
  columnA,
  columnB,
  rows,
  labelFlex = 1.2,
  rowPy = 'md',
  note,
  testID,
}: Props) {
  const theme = useTheme();
  const rowStyle = useMemo(
    () => ({ borderTopWidth: 1, borderTopColor: theme.colors.divider }),
    [theme],
  );
  return (
    <Box testID={testID}>
      <Box direction="row" gap="sm" pb="sm">
        <Box flex={labelFlex} />
        <Box flex={1}>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {columnA}
          </Text>
        </Box>
        <Box flex={1}>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {columnB}
          </Text>
        </Box>
      </Box>
      {rows.map((row) => (
        <Box
          key={row.key}
          testID={testID ? `${testID}.${row.key}` : undefined}
          direction="row"
          align="center"
          gap="sm"
          py={rowPy}
          style={rowStyle}
        >
          <Box flex={labelFlex} gap="xxs">
            <Text variant="smallSemibold">{row.label}</Text>
            <Text variant="caption" color={row.deltaColor}>
              {row.delta}
            </Text>
          </Box>
          <Box flex={1}>
            <Text variant="stat" numberOfLines={1}>
              {row.a}
            </Text>
          </Box>
          <Box flex={1}>
            <Text variant="stat" color="text2" numberOfLines={1}>
              {row.b}
            </Text>
          </Box>
        </Box>
      ))}
      {note ? (
        <Box pt="md" style={rowStyle}>
          <Text variant="caption" color="text2">
            {note}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
