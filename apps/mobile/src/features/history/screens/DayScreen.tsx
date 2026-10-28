import { useRouter } from 'expo-router';

import { BackHeader, Screen, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { DayCard } from '../components/DayCard';
import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { formatLongDate } from '../lib/dates';
import { historyHrefs } from '../lib/routes';
import { TODAY, dateOf, dayFromDateParam } from '../model/history.mock';
import { useHistoryStore } from '../model/history.store';

type Props = {
  /** "2026-10-19" from the route; falls back to today when missing or invalid. */
  date?: string | undefined;
};

/** Deep-linkable day detail (/history/day/[date]); the tab shows the same card inline. */
export function DayScreen({ date }: Props) {
  const { t } = useTranslation('history');
  const router = useRouter();
  const goBack = useBackToHistory();
  const deleted = useHistoryStore((s) => s.deletedSessionIds);
  const day = dayFromDateParam(date) ?? TODAY;

  return (
    <Screen
      testID={ids.dayViewScreen}
      header={<BackHeader testID={ids.dayViewBack} label={t('dayView.back')} onPress={goBack} />}
    >
      <Text testID={ids.dayViewTitle} variant="overlayTitle">
        {formatLongDate(dateOf(day))}
      </Text>
      <DayCard
        day={day}
        deletedSessionIds={deleted}
        hideDate
        onOpenSession={(id) => router.push(historyHrefs.session(id))}
        onStartPlanned={() => router.push(historyHrefs.startSession)}
      />
    </Screen>
  );
}
