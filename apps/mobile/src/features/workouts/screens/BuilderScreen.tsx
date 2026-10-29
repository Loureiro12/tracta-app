import { useEffect } from 'react';

import { ScrollView } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Pressable,
  Screen,
  Text,
  TextField,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useRoutines, useSaveRoutine } from '../api/useRoutines';
import { BuilderExerciseRow } from '../components/BuilderExerciseRow';
import { OverlayHeader } from '../components/OverlayHeader';
import { QueryState } from '../components/QueryState';
import { SelectChip } from '../components/SelectChip';
import { useExerciseCopy } from '../hooks/useExerciseCopy';
import { dayKey } from '../model/workouts.days';
import {
  countSets,
  draftFocus,
  draftFromRoutine,
  emptyDraft,
  estimateMinutes,
} from '../model/workouts.helpers';
import { toRoutineInput } from '../model/workouts.mappers';
import { workoutsRoutes } from '../model/workouts.routes';
import { useWorkoutsStore } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

import type { StepField } from '../components/BuilderExerciseRow';

/** Workout builder: name, description, day and the expandable exercise list. `id` (uuid) edits a routine. */
export function BuilderScreen({ id }: { id?: string | undefined }) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const draft = useWorkoutsStore((s) => s.draft);
  const setDraft = useWorkoutsStore((s) => s.setDraft);
  const updateDraft = useWorkoutsStore((s) => s.updateDraft);
  const routinesQuery = useRoutines();
  const saveRoutine = useSaveRoutine();
  const { summary } = useExerciseCopy();
  const editing = id ? routinesQuery.data?.find((r) => r.id === id) : undefined;
  const waiting = Boolean(id) && !editing;

  // Keep the draft across the picker round-trip; start a fresh one when the target changes.
  useEffect(() => {
    const state = useWorkoutsStore.getState();
    if (state.draft && state.draft.id === (id ?? null)) return;
    if (id && !editing) return; // wait for the routine to load
    setDraft(editing ? draftFromRoutine(editing) : emptyDraft());
  }, [id, editing, setDraft]);

  const cancel = () => {
    setDraft(null);
    router.back();
  };

  const save = () => {
    if (!draft || saveRoutine.isPending) return;
    if (!draft.name.trim()) return showToast(t('toast.nameRequired'));
    if (!draft.exercises.length) return showToast(t('toast.exerciseRequired'));
    saveRoutine.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        focus: draftFocus(draft).slice(0, 60),
        weekday: draft.day,
        exercises: toRoutineInput(draft.exercises),
      },
      {
        onSuccess: (saved) => {
          setDraft(null);
          showToast(draft.id ? t('toast.updated') : t('toast.created'));
          if (draft.id) router.back();
          else router.replace(workoutsRoutes.detail(saved.id));
        },
        onError: () => showToast(t('toast.saveFailed')),
      },
    );
  };

  const adjust = (i: number) => (field: StepField, delta: number, min: number, max: number) =>
    updateDraft((d) => {
      const e = d.exercises[i];
      if (!e) return;
      const next = Math.round(((e[field] ?? 0) + delta) * 100) / 100;
      e[field] = Math.min(max, Math.max(min, next));
    });
  const move = (i: number) => (delta: -1 | 1) =>
    updateDraft((d) => {
      const j = i + delta;
      const a = d.exercises[i];
      const b = d.exercises[j];
      if (!a || !b) return;
      d.exercises[i] = b;
      d.exercises[j] = a;
      d.open = j;
    });
  const remove = (i: number) => () =>
    updateDraft((d) => {
      d.exercises.splice(i, 1);
      d.open = -1;
    });
  const superset = (i: number) => () =>
    updateDraft((d) => {
      const a = d.exercises[i];
      const next = d.exercises[i + 1];
      if (!a) return;
      if (a.superset) {
        const key = a.superset;
        d.exercises.forEach((e) => {
          if (e.superset === key) e.superset = null;
        });
      } else if (next) {
        const key = next.superset ?? `S${Date.now() % 100000}`;
        a.superset = key;
        next.superset = key;
        a.rest = 0;
      }
    });

  const n = draft?.exercises.length ?? 0;
  const valid = Boolean(draft?.name.trim()) && n > 0;
  const dayOptions = [null, 0, 1, 2, 3, 4, 5, 6] as const;

  return (
    <Screen
      testID={ids.builderScreen}
      header={
        <OverlayHeader
          title={id ? t('builder.titleEdit') : t('builder.titleNew')}
          titleTestID={ids.builderTitle}
          left={{ label: t('builder.cancel'), onPress: cancel, testID: ids.builderCancel }}
        />
      }
      footer={
        <Box px="screen" pt="md" pb="2xl" bg="bg" borderColor="divider" style={styles.footer}>
          <Button
            testID={ids.builderSave}
            label={id ? t('builder.saveChanges') : t('builder.create')}
            variant={valid ? 'primary' : 'secondary'}
            size="xl"
            fullWidth
            onPress={save}
          />
        </Box>
      }
    >
      {waiting ? (
        <QueryState
          testID={ids.builderScreen}
          loading={routinesQuery.isLoading}
          error={routinesQuery.error}
          onRetry={() => void routinesQuery.refetch()}
        />
      ) : null}
      {draft && !waiting ? (
        <VStack gap="2xl">
          <VStack gap="sm">
            <TextField
              testID={ids.builderName}
              placeholder={t('builder.namePlaceholder')}
              value={draft.name}
              onChangeText={(name) => updateDraft((d) => void (d.name = name))}
            />
            <TextField
              testID={ids.builderDescription}
              placeholder={t('builder.descriptionPlaceholder')}
              value={draft.description}
              onChangeText={(description) => updateDraft((d) => void (d.description = description))}
            />
          </VStack>
          <VStack gap="sm">
            <HStack justify="space-between">
              <Text variant="secondarySemibold">{t('builder.day')}</Text>
              <Text variant="caption" color="text2">
                {t('builder.optional')}
              </Text>
            </HStack>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <HStack testID={ids.builderDays} gap="xs">
                {dayOptions.map((day, i) => (
                  <SelectChip
                    key={i}
                    testID={`${ids.builderDays}.${i}`}
                    label={day == null ? t('builder.free') : t(dayKey(day))}
                    selected={draft.day === day}
                    height={44}
                    onPress={() => updateDraft((d) => void (d.day = day))}
                  />
                ))}
              </HStack>
            </ScrollView>
          </VStack>
          <VStack gap="sm">
            <HStack justify="space-between">
              <Text variant="secondarySemibold">{t('builder.exercises')}</Text>
              <Text testID={ids.builderMeta} variant="caption" color="text2">
                {n
                  ? t('builder.meta', {
                      count: n,
                      sets: countSets(draft.exercises),
                      minutes: estimateMinutes(draft.exercises),
                    })
                  : t('builder.metaEmpty')}
              </Text>
            </HStack>
            {n === 0 ? (
              <Card testID={ids.builderEmpty} radius="pill" py="2xl" gap="xs">
                <Text variant="cardTitleSm" align="center">
                  {t('builder.emptyTitle')}
                </Text>
                <Text variant="secondary" color="text2" align="center">
                  {t('builder.emptyText')}
                </Text>
              </Card>
            ) : null}
            <VStack testID={ids.builderExercises} gap="sm">
              {draft.exercises.map((e, i) => (
                <BuilderExerciseRow
                  key={`${e.exerciseId}-${i}`}
                  testID={`${ids.builderExercises}.${i}`}
                  index={i}
                  total={n}
                  exercise={e}
                  open={draft.open === i}
                  summary={summary(e)}
                  onToggle={() => updateDraft((d) => void (d.open = d.open === i ? -1 : i))}
                  onAdjust={adjust(i)}
                  onMove={move(i)}
                  onRemove={remove(i)}
                  onSuperset={superset(i)}
                />
              ))}
            </VStack>
            <Pressable
              testID={ids.builderAdd}
              onPress={() => router.push(workoutsRoutes.picker('add'))}
              accessibilityLabel={t('builder.add')}
            >
              <Box
                radius="xl"
                borderWidth={1.5}
                borderColor="dividerStrong"
                align="center"
                justify="center"
                style={styles.add}
              >
                <Text variant="bodyBold">{t('builder.add')}</Text>
              </Box>
            </Pressable>
          </VStack>
        </VStack>
      ) : null}
    </Screen>
  );
}

const styles = {
  footer: { borderTopWidth: 1 } as const,
  add: { height: 54, borderStyle: 'dashed' } as const,
};
