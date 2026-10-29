import { useState } from 'react';

import { useRouter } from 'expo-router';

import { Button, HStack, ListGroup, ListRow, Sheet, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import { useDeleteRace, useRace, useSaveRace } from '../api/usePrograms';
import { QueryState } from '../components/QueryState';
import { SelectChip } from '../components/SelectChip';
import { StepperTile } from '../components/StepperTile';
import { RACE_DISTANCES, defaultGoal, formatClock, raceView } from '../model/workouts.helpers';
import { recentPaceSeconds } from '../model/workouts.mock';
import { DEFAULT_RACE } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

import type { Race } from '../model/workouts.types';

/** "Minha prova" sheet: distance, date and target time → required pace, recent pace and estimate. */
export function RaceSheetScreen() {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const query = useRace();
  const saveRace = useSaveRace();
  const deleteRace = useDeleteRace();
  const race = query.data ?? null;
  // The editable copy starts from the saved race (or the defaults) once it has loaded.
  const [edited, setRaceDraft] = useState<Race | null>(null);
  const draft = edited ?? (query.isSuccess ? (query.data ?? DEFAULT_RACE) : null);
  const busy = saveRace.isPending || deleteRace.isPending;
  const onError = () => showToast(t('toast.saveFailed'));

  if (!draft) {
    return (
      <Sheet
        testID={ids.raceScreen}
        title={t('race.title')}
        rightLabel={t('actions.close')}
        onClose={() => router.back()}
      >
        <QueryState
          testID={ids.raceScreen}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
      </Sheet>
    );
  }
  const view = raceView(draft, recentPaceSeconds);

  const save = () => {
    if (busy) return;
    saveRace.mutate(
      { race: draft, date: view.date },
      {
        onSuccess: () => {
          showToast(t('toast.raceSaved'));
          router.back();
        },
        onError,
      },
    );
  };
  const remove = () => {
    if (busy) return;
    deleteRace.mutate(undefined, {
      onSuccess: () => {
        showToast(t('toast.raceRemoved'));
        router.back();
      },
      onError,
    });
  };

  const rows = [
    { key: 'required', label: t('race.required'), value: `${formatClock(view.requiredPace)} /km` },
    { key: 'recent', label: t('race.recent'), value: `${formatClock(recentPaceSeconds)} /km` },
    {
      key: 'estimate',
      label: t('race.estimateToday'),
      value: `${formatClock(view.estimate)} ${
        view.diff > 0
          ? t('race.estimateOver', { time: formatClock(view.diff) })
          : t('race.estimateWithin')
      }`,
    },
  ];

  return (
    <Sheet
      testID={ids.raceScreen}
      title={t('race.title')}
      rightLabel={t('actions.close')}
      onClose={() => router.back()}
      footer={
        <Button
          testID={ids.raceSave}
          label={race ? t('race.save') : t('race.set')}
          size="lg"
          fullWidth
          onPress={save}
        />
      }
    >
      <Text variant="secondarySemibold">{t('race.distance')}</Text>
      <HStack testID={ids.raceDistances} gap="xs" align="stretch">
        {RACE_DISTANCES.map((d) => (
          <SelectChip
            key={d.distance}
            testID={`${ids.raceDistances}.${d.distance}`}
            label={t('race.km', { km: d.distance })}
            selected={draft.distance === d.distance}
            height={46}
            flex
            onPress={() =>
              setRaceDraft({ ...draft, distance: d.distance, km: d.km, goal: defaultGoal(d.km) })
            }
          />
        ))}
      </HStack>
      <HStack gap="sm" align="stretch">
        <StepperTile
          testID={ids.raceDate}
          label={t('race.date')}
          valueLabel={formatDate(view.date, { day: 'numeric', month: 'short' })}
          onDecrement={() => setRaceDraft({ ...draft, weeks: Math.max(1, draft.weeks - 1) })}
          onIncrement={() => setRaceDraft({ ...draft, weeks: Math.min(52, draft.weeks + 1) })}
          bg="bg"
        />
        <StepperTile
          testID={ids.raceGoal}
          label={t('race.goal')}
          valueLabel={formatClock(draft.goal)}
          onDecrement={() => setRaceDraft({ ...draft, goal: Math.max(600, draft.goal - 60) })}
          onIncrement={() => setRaceDraft({ ...draft, goal: Math.min(86_400, draft.goal + 60) })}
          bg="bg"
        />
      </HStack>
      <ListGroup testID={ids.raceRows}>
        {rows.map((r) => (
          <ListRow
            key={r.key}
            testID={`${ids.raceRows}.${r.key}`}
            label={r.label}
            value={r.value}
          />
        ))}
      </ListGroup>
      <Text variant="caption" color="text2">
        {t('race.note')}
      </Text>
      {race ? (
        <VStack align="center">
          <Button
            testID={ids.raceRemove}
            label={t('race.remove')}
            variant="dangerText"
            size="sm"
            onPress={remove}
          />
        </VStack>
      ) : null}
    </Sheet>
  );
}
