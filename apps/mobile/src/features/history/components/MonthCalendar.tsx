import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Card, Dot, HStack, Pressable, Text, VStack, useTheme } from '@tracta/design-system';

import { formatDate, useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { dateKeyOf } from '../lib/month';

import type { MonthGrid } from '../lib/month';
import type { DayActivity } from '../model/history.types';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

type Props = {
  grid: MonthGrid;
  /** Marker per day key (YYYY-MM-DD). */
  activity: ReadonlyMap<string, DayActivity>;
  selectedDate: string;
  todayKey: string;
  onSelect: (date: string) => void;
};

type Cell = { day: number | null; key: string; activity: DayActivity | null };

/** Label color and dot color of a cell: selected = ink pill, today without activity = faint green. */
function cellColors(
  activity: Cell['activity'],
  selected: boolean,
  future: boolean,
  isToday: boolean,
): { color: keyof SemanticColors; dotColor: keyof SemanticColors | undefined } {
  const color: keyof SemanticColors = selected ? 'textOnInk' : future ? 'text3' : 'text';
  const dotColor: keyof SemanticColors | undefined =
    activity === 'run'
      ? 'run'
      : activity === 'strength'
        ? 'brand'
        : isToday
          ? 'success'
          : undefined;
  return { color, dotColor };
}

/** Monthly grid (Monday first) with one dot per activity type; today has a brand ring. */
export function MonthCalendar({ grid, activity, selectedDate, todayKey, onSelect }: Props) {
  const { t } = useTranslation('history');
  const theme = useTheme();

  const rows = useMemo(() => {
    const cells: Cell[] = [];
    for (let i = 0; i < grid.cells; i++) {
      const day = i - grid.offset + 1;
      if (day >= 1 && day <= grid.daysInMonth) {
        const key = dateKeyOf(grid.year, grid.month, day);
        cells.push({ day, key, activity: activity.get(key) ?? null });
      } else cells.push({ day: null, key: `empty-${i}`, activity: null });
    }
    const out: Cell[][] = [];
    for (let r = 0; r < cells.length; r += 7) out.push(cells.slice(r, r + 7));
    return out;
  }, [grid, activity]);
  const monthName = formatDate(new Date(grid.year, grid.month, 1), { month: 'long' });
  const monthLabel = t('calendar.month', {
    month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
    year: grid.year,
  });

  const selectedStyle = useMemo<ViewStyle>(() => ({ backgroundColor: theme.colors.ink }), [theme]);
  const todayStyle = useMemo<ViewStyle>(
    () => ({ borderWidth: 1.5, borderColor: theme.colors.brand }),
    [theme],
  );
  const weekdays = t('calendar.weekdays').split(',');

  return (
    <Card testID={ids.calendar} padding="lg" gap="md">
      <HStack justify="space-between">
        <Text testID={ids.calendarMonth} variant="cardTitleSm" numberOfLines={1}>
          {monthLabel}
        </Text>
        <HStack gap="md">
          <HStack gap="xs">
            <Dot color="brand" size={7} />
            <Text variant="micro" color="text2">
              {t('calendar.legendStrength')}
            </Text>
          </HStack>
          <HStack gap="xs">
            <Dot color="run" size={7} />
            <Text variant="micro" color="text2">
              {t('calendar.legendRun')}
            </Text>
          </HStack>
        </HStack>
      </HStack>
      <HStack gap="xxs">
        {weekdays.map((letter, i) => (
          <Box key={i} flex={1} align="center">
            <Text variant="micro" color="text3">
              {letter}
            </Text>
          </Box>
        ))}
      </HStack>
      <VStack testID={ids.calendarDays} gap="xxs">
        {rows.map((row, r) => (
          <HStack key={r} gap="xxs">
            {row.map((cell, c) => {
              if (cell.day === null) return <Box key={c} style={styles.cell} />;
              const day = cell.day;
              const selected = cell.key === selectedDate;
              const future = cell.key > todayKey;
              const isToday = cell.key === todayKey;
              const { color, dotColor } = cellColors(cell.activity, selected, future, isToday);
              return (
                <Pressable
                  key={c}
                  testID={`${ids.calendarDays}.${day}`}
                  onPress={() => onSelect(cell.key)}
                  accessibilityLabel={t('calendar.dayLabel', { day })}
                  accessibilityState={{ selected }}
                  style={[
                    styles.cell,
                    selected ? selectedStyle : null,
                    isToday && !selected ? todayStyle : null,
                  ]}
                >
                  <Text variant="smallSemibold" color={color} tabular>
                    {String(day)}
                  </Text>
                  <Box
                    {...(dotColor ? { bg: dotColor } : {})}
                    style={[styles.dot, isToday && !cell.activity ? styles.dim : null]}
                  />
                </Pressable>
              );
            })}
          </HStack>
        ))}
      </VStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  dim: { opacity: 0.4 },
});
