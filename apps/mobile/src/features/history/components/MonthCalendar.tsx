import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Card, Dot, HStack, Pressable, Text, VStack, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import {
  CALENDAR_CELLS,
  DAYS_IN_MONTH,
  FIRST_DAY_OFFSET,
  TODAY,
  activityOf,
} from '../model/history.mock';

import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

type Props = {
  selectedDay: number;
  deletedSessionIds: readonly string[];
  onSelect: (day: number) => void;
};

type Cell = { day: number | null; activity: 'strength' | 'run' | null };

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
export function MonthCalendar({ selectedDay, deletedSessionIds, onSelect }: Props) {
  const { t } = useTranslation('history');
  const theme = useTheme();

  const rows = useMemo(() => {
    const cells: Cell[] = [];
    for (let i = 0; i < CALENDAR_CELLS; i++) {
      const day = i - FIRST_DAY_OFFSET + 1;
      cells.push(
        day >= 1 && day <= DAYS_IN_MONTH
          ? { day, activity: activityOf(day, deletedSessionIds) }
          : { day: null, activity: null },
      );
    }
    const out: Cell[][] = [];
    for (let r = 0; r < cells.length; r += 7) out.push(cells.slice(r, r + 7));
    return out;
  }, [deletedSessionIds]);

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
          {t('calendar.month')}
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
              const selected = day === selectedDay;
              const future = day > TODAY;
              const isToday = day === TODAY;
              const { color, dotColor } = cellColors(cell.activity, selected, future, isToday);
              return (
                <Pressable
                  key={c}
                  testID={`${ids.calendarDays}.${day}`}
                  onPress={() => onSelect(day)}
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
