import { Box, HStack, Text } from '@tracta/design-system';

import type { SemanticColors, TypographyVariant } from '@tracta/design-system';
import type { ReactNode } from 'react';

type CellProps = {
  label: string;
  value: string;
  sub?: string;
  valueVariant?: TypographyVariant;
  valueColor?: keyof SemanticColors;
  testID?: string;
};

/** Small grey label over a condensed bold number (and an optional caption below). */
export function StatCell({
  label,
  value,
  sub,
  valueVariant = 'stat',
  valueColor = 'text',
  testID,
}: CellProps) {
  return (
    <Box gap="xxs" testID={testID}>
      <Text variant="caption" color="text2">
        {label}
      </Text>
      <Text variant={valueVariant} color={valueColor} numberOfLines={1}>
        {value}
      </Text>
      {sub ? (
        <Text variant="micro" color="text2">
          {sub}
        </Text>
      ) : null}
    </Box>
  );
}

type GridProps = {
  columns: number;
  children: ReactNode[];
  gap?: 'sm' | 'md' | 'ml';
  testID?: string;
};

/** Lays out children in equal-width columns, wrapping into rows. */
export function StatGrid({ columns, children, gap = 'md', testID }: GridProps) {
  const rows: ReactNode[][] = [];
  children.forEach((child, i) => {
    const row = Math.floor(i / columns);
    (rows[row] ??= []).push(child);
  });
  return (
    <Box gap={gap} testID={testID}>
      {rows.map((row, r) => (
        <HStack key={r} gap={gap} align="stretch">
          {row.map((child, c) => (
            <Box key={c} flex={1}>
              {child}
            </Box>
          ))}
          {row.length < columns
            ? Array.from({ length: columns - row.length }, (_, i) => <Box key={`f${i}`} flex={1} />)
            : null}
        </HStack>
      ))}
    </Box>
  );
}
