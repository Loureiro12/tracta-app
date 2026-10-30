import { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  Screen,
  SectionLabel,
  Segmented,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { useAchievements } from '../api/useAchievements';
import { useRecords } from '../api/useHistory';
import { BadgeCard } from '../components/BadgeCard';
import { QueryState } from '../components/QueryState';
import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { badgeRows } from '../lib/badges';
import { formatShortDate } from '../lib/dates';
import { itemId } from '../lib/ids';
import { RECORD_SLUGS, runRows, strengthRows } from '../lib/records';
import { historyHrefs } from '../lib/routes';

import type { RecordRow as RecordRowData } from '../lib/records';
import type { ViewStyle } from 'react-native';

export type AchievementsTab = 'records' | 'badges';

type Props = {
  /** `?tab=records|badges` from the route. */
  tab?: string | undefined;
};

function RecordRow({ row, last }: { row: RecordRowData; last: boolean }) {
  const { t } = useTranslation('history');
  const theme = useTheme();
  const style = useMemo<ViewStyle>(
    () => ({
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.md,
      minHeight: 62,
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: theme.colors.divider,
    }),
    [theme, last],
  );
  const rowId = itemId(ids.achievementsRecords, row.id);
  const d = row.detail;
  const detail = !d
    ? t('achievements.recordDetail.none')
    : d.bodyweight
      ? t('achievements.recordDetail.bodyweight', { date: formatShortDate(d.date) })
      : d.reps !== null
        ? t('achievements.recordDetail.reps', { reps: d.reps, date: formatShortDate(d.date) })
        : t('achievements.recordDetail.date', { date: formatShortDate(d.date) });
  return (
    <Box testID={rowId} style={style}>
      <VStack flex={1} gap="xxs">
        <Text testID={`${rowId}.name`} variant="bodySemibold">
          {t(`achievements.records.${row.id}.name`)}
        </Text>
        <Text variant="caption" color="text2">
          {detail}
        </Text>
      </VStack>
      <VStack align="flex-end" gap="xxs">
        <Text testID={`${rowId}.value`} variant="stat" numberOfLines={1}>
          {row.value}
        </Text>
        <Text variant="captionBold" color={row.delta ? 'brand' : 'text2'} numberOfLines={1}>
          {row.delta === 'new' ? t('achievements.recordNew') : (row.delta ?? '')}
        </Text>
      </VStack>
    </Box>
  );
}

/** Records & achievements (/history/achievements?tab=records|badges). */
export function AchievementsScreen({ tab }: Props) {
  const { t } = useTranslation('history');
  const router = useRouter();
  const goBack = useBackToHistory();
  const [current, setCurrent] = useState<AchievementsTab>(tab === 'badges' ? 'badges' : 'records');
  const records = useRecords(RECORD_SLUGS);
  const recordGroups = useMemo(
    () =>
      records.data
        ? [
            { id: 'strength' as const, rows: strengthRows(records.data) },
            { id: 'run' as const, rows: runRows(records.data) },
          ]
        : null,
    [records.data],
  );
  const badges = useAchievements();
  const earned = (badges.data ?? []).filter((b) => b.earnedOn !== null).length;
  const rows = useMemo(() => badgeRows(badges.data ?? []), [badges.data]);

  return (
    <Screen
      testID={ids.achievementsScreen}
      header={
        <BackHeader testID={ids.achievementsBack} label={t('achievements.back')} onPress={goBack} />
      }
    >
      <Text testID={ids.achievementsTitle} variant="overlayTitle">
        {t('achievements.title')}
      </Text>
      <Segmented
        testID={ids.achievementsTab}
        options={[
          { value: 'records', label: t('achievements.tab.records') },
          { value: 'badges', label: t('achievements.tab.badges') },
        ]}
        value={current}
        onChange={setCurrent}
      />
      {current === 'records' ? (
        <VStack testID={ids.achievementsRecords} gap="md">
          <Button
            testID={ids.achievementsShare}
            label={t('achievements.shareRecord')}
            shape="rounded"
            fullWidth
            onPress={() => router.push(historyHrefs.share('pr'))}
          />
          {!recordGroups ? (
            <QueryState
              testID={ids.achievementsRecords}
              error={records.isError}
              onRetry={() => void records.refetch()}
            />
          ) : null}
          {(recordGroups ?? []).map((group) => (
            <VStack key={group.id} gap="sm">
              <SectionLabel>{t(`achievements.group.${group.id}`)}</SectionLabel>
              <Card px="xl" py="xxs" gap="none">
                {group.rows.map((row, i) => (
                  <RecordRow key={row.id} row={row} last={i === group.rows.length - 1} />
                ))}
              </Card>
            </VStack>
          ))}
          <Text testID={ids.achievementsNote} variant="caption" color="text2">
            {t('achievements.recordsNote')}
          </Text>
        </VStack>
      ) : (
        <VStack gap="md">
          {badges.data ? (
            <Text testID={ids.achievementsCount} variant="small" color="text2">
              {t('achievements.count', { earned, total: badges.data.length })}
            </Text>
          ) : (
            <QueryState
              testID={ids.achievementsBadges}
              error={badges.isError}
              onRetry={() => void badges.refetch()}
            />
          )}
          <VStack testID={ids.achievementsBadges} gap="sm">
            {rows.map((row, i) => (
              <HStack key={i} gap="sm" align="stretch">
                {row.map((badge) => (
                  <Box key={badge.id} flex={1}>
                    <BadgeCard badge={badge} />
                  </Box>
                ))}
              </HStack>
            ))}
          </VStack>
        </VStack>
      )}
    </Screen>
  );
}
