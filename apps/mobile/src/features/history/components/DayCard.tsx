import { useMemo } from 'react';

import { Box, Card, HStack, Icon, Pressable, Text, VStack, useTheme } from '@tracta/design-system';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { formatLongDate } from '../lib/dates';
import { hoursMinutes } from '../lib/format';
import { itemId } from '../lib/ids';
import { dayHealth } from '../model/history.mock';

import type { DayItem } from '../model/history.types';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

type Props = {
  date: Date;
  dateKey: string;
  todayKey: string;
  items: readonly DayItem[];
  onOpenSession: (id: string) => void;
  onStartPlanned: () => void;
  /** Hide the date header (the overlay shows it as its title). */
  hideDate?: boolean;
};

const TAG_COLOR: Record<DayItem['kind'], keyof SemanticColors> = {
  strength: 'brandText',
  run: 'run',
  activity: 'run',
  planned: 'text2',
};

/** Day detail under the calendar: steps/sleep line and the sessions of the day (or an empty state). */
export function DayCard({
  date,
  dateKey,
  todayKey,
  items,
  onOpenSession,
  onStartPlanned,
  hideDate,
}: Props) {
  const { t } = useTranslation('history');
  const theme = useTheme();
  const health = dayHealth(dateKey, todayKey);
  const future = dateKey > todayKey;
  const rowStyle = useMemo<ViewStyle>(
    () => ({
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      paddingVertical: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
    }),
    [theme],
  );

  const describe = (item: DayItem): { title: string; line: string } => {
    switch (item.kind) {
      case 'strength':
        return {
          title: t('day.strengthTitle', { routine: item.routineName, focus: item.focus }),
          line: t('day.strengthLine', { minutes: item.minutes, sets: item.sets }),
        };
      case 'run':
        return { title: t('day.runTitle'), line: item.summary };
      case 'activity':
        return { title: t(`day.activity.${item.activity}`), line: item.summary };
      case 'planned':
        return {
          title: t('day.strengthTitle', { routine: item.routineName, focus: item.focus }),
          line: t('day.plannedLine'),
        };
    }
  };

  return (
    <Card testID={ids.dayCard} px="xl" py="sm" gap="none">
      <HStack justify="space-between" align="baseline" gap="sm" py="sm">
        {hideDate ? (
          <Box flex={1} />
        ) : (
          <Text testID={ids.dayDate} variant="cardTitleSm" numberOfLines={1}>
            {formatLongDate(date)}
          </Text>
        )}
        <Text testID={ids.dayMeta} variant="caption" color="text2" numberOfLines={1}>
          {health
            ? t('day.meta', {
                steps: formatNumber(health.steps),
                sleep: hoursMinutes(health.sleepMinutes),
              })
            : t('day.metaUnavailable')}
        </Text>
      </HStack>
      <Box testID={ids.daySessions}>
        {items.map((item) => {
          const { title, line } = describe(item);
          const rowId = itemId(ids.daySessions, item.key);
          return (
            <Pressable
              key={item.key}
              testID={rowId}
              onPress={() => (item.kind === 'planned' ? onStartPlanned() : onOpenSession(item.id))}
              accessibilityLabel={title}
              style={rowStyle}
            >
              <VStack flex={1} gap="xxs">
                <Text
                  testID={`${rowId}.tag`}
                  variant="captionBold"
                  color={TAG_COLOR[item.kind]}
                  uppercase
                >
                  {t(`day.tag.${item.kind}`)}
                </Text>
                <Text testID={`${rowId}.title`} variant="cardTitleSm">
                  {title}
                </Text>
                <Text testID={`${rowId}.line`} variant="secondary" color="text2">
                  {line}
                </Text>
              </VStack>
              <Icon name="chevron-right" size={16} color="text3" />
            </Pressable>
          );
        })}
      </Box>
      {items.length === 0 ? (
        <Box style={rowStyle}>
          <VStack gap="xxs">
            <Text testID={ids.dayEmpty} variant="cardTitleSm">
              {future ? t('day.futureTitle') : t('day.restTitle')}
            </Text>
            <Text testID={ids.dayEmptyLine} variant="secondary" color="text2">
              {future ? t('day.futureLine') : t('day.restLine')}
            </Text>
          </VStack>
        </Box>
      ) : null}
    </Card>
  );
}
