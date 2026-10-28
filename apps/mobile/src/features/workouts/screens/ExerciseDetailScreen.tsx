import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  Chip,
  HStack,
  Screen,
  Switch,
  Text,
  TextField,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { OverlayHeader } from '../components/OverlayHeader';
import { useWorkoutsData } from '../hooks/useWorkoutsData';
import { findPrev, formatClock, formatKg } from '../model/workouts.helpers';
import { groupInstructions, routines } from '../model/workouts.mock';
import { workoutsRoutes } from '../model/workouts.routes';
import { useWorkoutsStore } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

/** Mock number of logged sessions for seeded exercises (the prototype's evolution series). */
const SEEDED_SESSIONS = 8;

/** Exercise detail overlay: cues, defaults, personal history, notes, favorite and custom actions. */
export function ExerciseDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const notes = useWorkoutsStore((s) => s.exerciseNotes[id] ?? '');
  const setExerciseNote = useWorkoutsStore((s) => s.setExerciseNote);
  const toggleFavorite = useWorkoutsStore((s) => s.toggleFavorite);
  const removeUserExercise = useWorkoutsStore((s) => s.removeUserExercise);
  const { library } = useWorkoutsData();
  const [armed, setArmed] = useState(false);
  const exercise = library.find((l) => l.id === id);

  const header = (
    <OverlayHeader
      title={t('exercise.title')}
      titleTestID={ids.exerciseTitle}
      right={{ label: t('actions.close'), onPress: () => router.back(), testID: ids.exerciseClose }}
    />
  );
  if (!exercise) {
    return (
      <Screen testID={ids.exerciseScreen} header={header}>
        <Text color="text2">{t('exercise.notFound')}</Text>
      </Screen>
    );
  }

  const typeLabel = t(`form.types.${exercise.type}.label`);
  const tags = [exercise.group, ...exercise.secondary, exercise.equipment, typeLabel];
  const instructions =
    exercise.notes || groupInstructions[exercise.group] || t('exercise.noInstructions');
  const defaults =
    exercise.type === 'c'
      ? t('copy.minutes', { count: exercise.reps })
      : exercise.type === 'b'
        ? t('exercise.defaultsBodyweight', {
            reps: exercise.reps,
            rest: formatClock(exercise.rest),
          })
        : t('exercise.defaultsLoad', {
            reps: exercise.reps,
            kg: formatKg(exercise.kg ?? 0),
            rest: formatClock(exercise.rest),
          });

  const prev = findPrev(routines, exercise.id);
  const bodyweight = prev[0]?.[0] == null;
  const history = prev.length
    ? [
        {
          key: 'last',
          label: t('exercise.last'),
          value: bodyweight
            ? t('copy.reps', { count: prev[0]?.[1] ?? 0 })
            : t('copy.kg', { kg: formatKg(prev[0]?.[0] ?? 0) }),
        },
        {
          key: 'best',
          label: t('exercise.best'),
          value: bodyweight
            ? t('copy.reps', { count: Math.max(...prev.map((p) => p[1])) })
            : t('copy.kg', { kg: formatKg(Math.max(...prev.map((p) => p[0] ?? 0))) }),
        },
        { key: 'sessions', label: t('exercise.sessions'), value: String(SEEDED_SESSIONS) },
      ]
    : [];

  const remove = () => {
    if (!armed) return setArmed(true);
    removeUserExercise(exercise.id);
    showToast(t('toast.exerciseDeleted'));
    router.back();
  };

  return (
    <Screen testID={ids.exerciseScreen} header={header}>
      <VStack gap="xs">
        <Text variant="overlayTitle">{exercise.name}</Text>
        <Text testID={ids.exerciseSubtitle} variant="secondary" color="text2">
          {[exercise.group, exercise.equipment, exercise.custom ? t('picker.custom') : null]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </VStack>
      <Box bg="fill1" radius="pill" align="center" justify="center" p="screen" style={styles.video}>
        <Box bg="bg" radius="xs" px="sm" py="xs">
          <Text variant="secondarySemibold" color="text2">
            {t('exercise.noVideo')}
          </Text>
        </Box>
      </Box>
      <HStack testID={ids.exerciseTags} gap="xs" wrap="wrap">
        {tags.map((tag, i) => (
          <Chip key={`${tag}-${i}`} testID={`${ids.exerciseTags}.${i}`} label={tag} />
        ))}
      </HStack>
      <Card testID={ids.exerciseInstructions} padding="lg" px="xl" radius="pill" gap="xs">
        <Text variant="bodySemibold">{t('exercise.howTo')}</Text>
        <Text variant="small" color="text2">
          {instructions}
        </Text>
      </Card>
      <Card testID={ids.exerciseDefaults} padding="lg" px="xl" radius="pill" gap="xs">
        <Text variant="bodySemibold">{t('exercise.defaults')}</Text>
        <Text variant="small" color="text2">
          {defaults}
        </Text>
      </Card>
      <Card testID={ids.exerciseHistory} padding="lg" px="xl" radius="pill" gap="sm">
        <Text variant="bodySemibold">{t('exercise.history')}</Text>
        {history.length ? (
          <VStack gap="sm">
            <HStack gap="sm" align="flex-start">
              {history.map((h) => (
                <VStack key={h.key} gap="xxs" flex={1}>
                  <Text variant="caption" color="text2">
                    {h.label}
                  </Text>
                  <Text variant="subtitle" tabular numberOfLines={1}>
                    {h.value}
                  </Text>
                </VStack>
              ))}
            </HStack>
            <Button
              testID={ids.exerciseEvolution}
              label={t('exercise.evolution')}
              variant="ghost"
              size="xs"
              onPress={() => router.push(workoutsRoutes.history())}
            />
          </VStack>
        ) : (
          <Text testID={ids.exerciseHistoryEmpty} variant="small" color="text2">
            {t('exercise.noHistory')}
          </Text>
        )}
      </Card>
      <VStack gap="sm">
        <Text variant="secondarySemibold">{t('exercise.notes')}</Text>
        <TextField
          testID={ids.exerciseNotes}
          placeholder={t('exercise.notesPlaceholder')}
          value={notes}
          onChangeText={(v) => setExerciseNote(exercise.id, v)}
          multiline
        />
      </VStack>
      <Card padding="lg" radius="lg" gap="none">
        <HStack justify="space-between" gap="md">
          <Text variant="bodySemibold">{t('exercise.favorite')}</Text>
          <Switch
            testID={ids.exerciseFavorite}
            value={exercise.favorite}
            onValueChange={() => toggleFavorite(exercise.id)}
            accessibilityLabel={t('exercise.favorite')}
          />
        </HStack>
      </Card>
      {exercise.custom ? (
        <HStack testID={ids.exerciseCustom} gap="sm">
          <Box flex={1}>
            <Button
              testID={ids.exerciseEdit}
              label={t('exercise.edit')}
              variant="surface"
              size="lg"
              fullWidth
              onPress={() => router.push(workoutsRoutes.exerciseNew({ edit: exercise.id }))}
            />
          </Box>
          <Box flex={1}>
            <Button
              testID={ids.exerciseDelete}
              label={armed ? t('exercise.confirmDelete') : t('exercise.delete')}
              variant="dangerText"
              size="lg"
              fullWidth
              onPress={remove}
            />
          </Box>
        </HStack>
      ) : null}
    </Screen>
  );
}

const styles = { video: { height: 150 } as const };
