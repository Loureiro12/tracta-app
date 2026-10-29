import { useRouter } from 'expo-router';

import { BackHeader, Box, Button, Card, HStack, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useDuplicateRoutine, useRoutine } from '../api/useRoutines';
import { QueryState } from '../components/QueryState';
import { useExerciseCopy } from '../hooks/useExerciseCopy';
import { dayFullKey } from '../model/workouts.days';
import { countSets } from '../model/workouts.helpers';
import { workoutsRoutes } from '../model/workouts.routes';
import { workoutsIds as ids } from '../workouts.testids';

/** Routine detail overlay (`id` is the routine uuid): stats, prescription, start / edit / duplicate. */
export function RoutineDetailScreen({ id }: { id: string }) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const query = useRoutine(id);
  const duplicateRoutine = useDuplicateRoutine();
  const { detailLine } = useExerciseCopy();
  const routine = query.data;

  const header = (
    <BackHeader testID={ids.detailBack} label={t('detail.back')} onPress={() => router.back()} />
  );

  if (!routine) {
    return (
      <Screen testID={ids.detailScreen} header={header}>
        <QueryState
          testID={ids.detailScreen}
          loading={query.isLoading}
          error={query.error}
          onRetry={() => void query.refetch()}
        />
        {query.isSuccess ? <Text color="text2">{t('detail.notFound')}</Text> : null}
      </Screen>
    );
  }

  const duplicate = () => {
    if (duplicateRoutine.isPending) return;
    duplicateRoutine.mutate(
      { id: routine.id, name: (label) => t('routines.defaultName', { id: label }) },
      {
        onSuccess: (copy) => {
          showToast(t('toast.duplicated', { name: routine.name, id: copy.label }));
          router.replace(workoutsRoutes.detail(copy.id));
        },
        onError: () => showToast(t('toast.saveFailed')),
      },
    );
  };

  const stats = [
    { key: 'exercises', label: t('detail.exercises'), value: String(routine.exercises.length) },
    { key: 'sets', label: t('detail.sets'), value: String(countSets(routine.exercises)) },
    { key: 'estimate', label: t('detail.estimated'), value: `~${routine.estMinutes} min` },
  ];

  return (
    <Screen testID={ids.detailScreen} header={header}>
      <VStack gap="xs">
        <Text variant="secondary" color="text2">
          {`${routine.name} · ${
            routine.day != null
              ? t('detail.plannedFor', { day: t(dayFullKey(routine.day)) })
              : t('detail.noDay')
          }`}
        </Text>
        <Text testID={ids.detailTitle} variant="overlayTitle" numberOfLines={1}>
          {routine.focus}
        </Text>
      </VStack>
      <HStack testID={ids.detailStats} gap="sm" align="stretch">
        {stats.map((s) => (
          <Box key={s.key} flex={1}>
            <Card padding="md" radius="lg" gap="xxs">
              <Text variant="caption" color="text2">
                {s.label}
              </Text>
              <Text variant="stat" tabular numberOfLines={1}>
                {s.value}
              </Text>
            </Card>
          </Box>
        ))}
      </HStack>
      <Box testID={ids.detailExercises} bg="surface" radius="card" px="xl" py="xs">
        {routine.exercises.map((e, i) => (
          <HStack
            key={`${e.exerciseId}-${i}`}
            testID={`${ids.detailExercises}.${i}`}
            gap="md"
            align="flex-start"
            py="ml"
            borderColor="divider"
            style={i === routine.exercises.length - 1 ? undefined : styles.row}
          >
            <Box style={styles.index}>
              <Text variant="secondary" color="text3" tabular>
                {String(i + 1)}
              </Text>
            </Box>
            <VStack gap="xxs" flex={1}>
              <Text variant="cardTitleSm">{e.name}</Text>
              <Text variant="secondary" color="text2">
                {detailLine(e)}
              </Text>
            </VStack>
          </HStack>
        ))}
      </Box>
      <Button
        testID={ids.detailStart}
        label={t('detail.start')}
        size="lg"
        shape="pill"
        fullWidth
        onPress={() => router.push(workoutsRoutes.session(routine.id))}
      />
      <HStack gap="sm">
        <Box flex={1}>
          <Button
            testID={ids.detailEdit}
            label={t('detail.edit')}
            variant="secondary"
            fullWidth
            onPress={() => router.push(workoutsRoutes.builder(routine.id))}
          />
        </Box>
        <Box flex={1}>
          <Button
            testID={ids.detailDuplicate}
            label={t('detail.duplicate')}
            variant="secondary"
            fullWidth
            onPress={duplicate}
          />
        </Box>
      </HStack>
    </Screen>
  );
}

const styles = {
  row: { borderBottomWidth: 1 } as const,
  index: { width: 24, paddingTop: 2 } as const,
};
