import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Icon,
  Pressable,
  Screen,
  ScreenHeader,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { DayCard } from '../components/DayCard';
import { EvolutionCard } from '../components/EvolutionCard';
import { MonthCalendar } from '../components/MonthCalendar';
import { QueryState } from '../components/QueryState';
import { StatTile } from '../components/StatTile';
import { historyIds as ids } from '../history.testids';
import { useMonthModel } from '../hooks/useMonthModel';
import { decimal } from '../lib/format';
import { defaultSelection, parseDateKey } from '../lib/month';
import { historyHrefs } from '../lib/routes';
import { useHistoryStore } from '../model/history.store';

import type { ViewStyle } from 'react-native';

type ReportRange = '7d' | '30d' | 'custom';

/** Histórico tab: recap + achievements entries, calendar with day detail, month stats, evolution. */
export function HistoryScreen() {
  const { t } = useTranslation('history');
  const router = useRouter();
  const theme = useTheme();
  const picked = useHistoryStore((s) => s.selectedDate);
  const selectDate = useHistoryStore((s) => s.selectDate);
  const { query, view, grid, todayKey, byDay, activity, itemsOf } = useMonthModel();
  const selectedDate = picked ?? defaultSelection(byDay, todayKey);
  const selected = parseDateKey(selectedDate) ?? new Date();

  const reportStyle = useMemo<ViewStyle>(
    () => ({
      flex: 1,
      height: 48,
      borderRadius: theme.radii.md,
      backgroundColor: theme.colors.fill2,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme],
  );
  const reports: { range: ReportRange; testID: string }[] = [
    { range: '7d', testID: ids.report7d },
    { range: '30d', testID: ids.report30d },
    { range: 'custom', testID: ids.reportCustom },
  ];

  return (
    <Screen
      testID={ids.screen}
      bottomInset="tab"
      header={
        <ScreenHeader
          testID={ids.header}
          title={t('title')}
          actions={
            <Button
              testID={ids.share}
              label={t('header.share')}
              icon="share"
              size="xs"
              onPress={() => router.push(historyHrefs.share('month'))}
            />
          }
        />
      }
    >
      <Card
        testID={ids.recapOpen}
        variant="ink"
        px="xl"
        py="lg"
        onPress={() => router.push(historyHrefs.recap)}
        accessibilityLabel={t('recapCard.title')}
      >
        <HStack gap="md" justify="space-between">
          <VStack flex={1} gap="xxs">
            <Text variant="caption" color="text2OnInk">
              {t('recapCard.eyebrow')}
            </Text>
            <Text variant="stat" color="textOnInk" numberOfLines={1}>
              {t('recapCard.title')}
            </Text>
            <Text variant="secondary" color="text2OnInk" numberOfLines={1}>
              {t('recapCard.line')}
            </Text>
          </VStack>
          <Box bg="surface" radius="xl" px="ml" justify="center" style={styles.pill}>
            <Text variant="buttonXs">{t('recapCard.cta')}</Text>
          </Box>
        </HStack>
      </Card>

      <Card
        testID={ids.achievementsOpen}
        px="xl"
        py="ml"
        onPress={() => router.push(historyHrefs.achievements())}
        accessibilityLabel={t('achievementsCard.title')}
      >
        <HStack gap="md" justify="space-between">
          <VStack flex={1} gap="xxs">
            <Text variant="cardTitleSm">{t('achievementsCard.title')}</Text>
            <Text variant="secondary" color="text2">
              {t('achievementsCard.sub')}
            </Text>
          </VStack>
          <Icon name="chevron-right" size={16} color="text3" />
        </HStack>
      </Card>

      {view ? (
        <>
          <MonthCalendar
            grid={grid}
            activity={activity}
            selectedDate={selectedDate}
            todayKey={todayKey}
            onSelect={selectDate}
          />

          <DayCard
            date={selected}
            dateKey={selectedDate}
            todayKey={todayKey}
            items={itemsOf(selectedDate)}
            onOpenSession={(id) => router.push(historyHrefs.session(id))}
            onStartPlanned={() => router.push(historyHrefs.startSession)}
          />

          <HStack gap="sm" align="stretch">
            <StatTile
              testID={ids.statWorkouts}
              label={t('stats.workouts')}
              value={String(view.totals.workouts)}
            />
            <StatTile
              testID={ids.statRun}
              label={t('stats.run')}
              value={`${decimal(view.totals.runKm)} km`}
            />
            <StatTile
              testID={ids.statVolume}
              label={t('stats.volume')}
              value={`${decimal(view.totals.volumeKg / 1000)} t`}
            />
          </HStack>
        </>
      ) : (
        <QueryState
          testID={ids.calendar}
          error={query.isError}
          onRetry={() => void query.refetch()}
        />
      )}

      <Card px="xl" py="lg" gap="md">
        <HStack justify="space-between" align="baseline" gap="sm">
          <Text variant="bodySemibold">{t('reports.title')}</Text>
          <Text variant="caption" color="text2" numberOfLines={1}>
            {t('reports.sub')}
          </Text>
        </HStack>
        <HStack gap="sm">
          {reports.map((r) => (
            <Pressable
              key={r.range}
              testID={r.testID}
              onPress={() => router.push(historyHrefs.report(r.range))}
              style={reportStyle}
            >
              <Text variant="smallBold">{t(`reports.${r.range}`)}</Text>
            </Pressable>
          ))}
        </HStack>
      </Card>

      <EvolutionCard />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36 },
});
