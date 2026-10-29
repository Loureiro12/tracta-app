import { useRouter } from 'expo-router';

import { BackHeader, Screen, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { DayCard } from '../components/DayCard';
import { QueryState } from '../components/QueryState';
import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { useMonthModel } from '../hooks/useMonthModel';
import { formatLongDate } from '../lib/dates';
import { parseDateKey } from '../lib/month';
import { historyHrefs } from '../lib/routes';

type Props = {
  /** "2026-10-19" from the route; falls back to today when missing or invalid. */
  date?: string | undefined;
};

/** Deep-linkable day detail (/history/day/[date]); the tab shows the same card inline. */
export function DayScreen({ date }: Props) {
  const { t } = useTranslation('history');
  const router = useRouter();
  const goBack = useBackToHistory();
  const { query, view, todayKey, itemsOf } = useMonthModel(date);
  const dateKey = parseDateKey(date) ? (date ?? todayKey) : todayKey;
  const day = parseDateKey(dateKey) ?? new Date();

  return (
    <Screen
      testID={ids.dayViewScreen}
      header={<BackHeader testID={ids.dayViewBack} label={t('dayView.back')} onPress={goBack} />}
    >
      <Text testID={ids.dayViewTitle} variant="overlayTitle">
        {formatLongDate(day)}
      </Text>
      {view ? (
        <DayCard
          date={day}
          dateKey={dateKey}
          todayKey={todayKey}
          items={itemsOf(dateKey)}
          hideDate
          onOpenSession={(id) => router.push(historyHrefs.session(id))}
          onStartPlanned={() => router.push(historyHrefs.startSession)}
        />
      ) : (
        <QueryState
          testID={ids.dayCard}
          error={query.isError}
          onRetry={() => void query.refetch()}
        />
      )}
    </Screen>
  );
}
