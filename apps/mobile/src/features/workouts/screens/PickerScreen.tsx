import { useEffect, useState } from 'react';

import { ScrollView } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  CheckCircle,
  Chip,
  HStack,
  Icon,
  Pressable,
  Screen,
  Text,
  TextField,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useExerciseLibrary } from '../api/useExercises';
import { useRoutines } from '../api/useRoutines';
import { QueryState } from '../components/QueryState';
import { draftFromLibrary, normalize } from '../model/workouts.helpers';
import { exerciseCategories, exerciseIdFromName } from '../model/workouts.mock';
import { workoutsRoutes } from '../model/workouts.routes';
import { useWorkoutsStore } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

type Category = 'all' | (typeof exerciseCategories)[number];

/** Exercise picker: search, muscle-group filter, multi-select (`add`) or browse (`lib`). */
export function PickerScreen({ mode }: { mode: 'add' | 'lib' }) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const selection = useWorkoutsStore((s) => s.pickerSelection);
  const toggle = useWorkoutsStore((s) => s.togglePickerSelection);
  const addExercisesToDraft = useWorkoutsStore((s) => s.addExercisesToDraft);
  const draft = useWorkoutsStore((s) => s.draft);
  const libraryQuery = useExerciseLibrary();
  const library = libraryQuery.data ?? [];
  const allRoutines = useRoutines().data ?? [];
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const libMode = mode === 'lib';

  // The selection is shared with the exercise form; drop it when the picker goes away.
  useEffect(() => () => useWorkoutsStore.getState().setPickerSelection([]), []);

  const inDraft = new Set(draft?.exercises.map((e) => e.exerciseId) ?? []);
  const q = normalize(query.trim());
  const list = library.filter(
    (l) =>
      (category === 'all' || l.group === category || l.secondary.includes(category)) &&
      (!q || normalize(l.name).includes(q) || normalize(l.group).includes(q)),
  );
  const categories: { key: string; value: Category; label: string }[] = [
    { key: 'all', value: 'all', label: t('picker.all') },
    ...exerciseCategories.map((c) => ({ key: exerciseIdFromName(c), value: c, label: c })),
  ];

  const add = () => {
    if (!selection.length) return showToast(t('toast.selectExercise'));
    const count = selection.length;
    addExercisesToDraft(
      selection
        .map((id) => library.find((e) => e.id === id))
        .filter((e) => e !== undefined)
        .map((e) => draftFromLibrary(e, allRoutines)),
    );
    showToast(t('toast.added', { count }));
    router.back();
  };

  const subtitle = (l: (typeof library)[number]) =>
    [
      l.favorite ? t('picker.favorite') : null,
      l.group,
      l.equipment,
      l.custom ? t('picker.custom') : null,
      inDraft.has(l.id) ? t('picker.inWorkout') : null,
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Screen
      testID={ids.pickerScreen}
      bg="surface"
      scroll={false}
      padded={false}
      footer={
        libMode ? undefined : (
          <Box px="screen" pt="md" pb="2xl" borderColor="divider" style={styles.footer}>
            <Button
              testID={ids.pickerAdd}
              label={
                selection.length ? t('picker.add', { count: selection.length }) : t('picker.select')
              }
              variant={selection.length ? 'primary' : 'secondary'}
              size="xl"
              fullWidth
              onPress={add}
            />
          </Box>
        )
      }
    >
      <HStack justify="space-between" px="screen">
        <Text testID={ids.pickerTitle} variant="nameTitle" numberOfLines={1}>
          {libMode ? t('picker.titleLibrary') : t('picker.titleAdd')}
        </Text>
        <Button
          testID={ids.pickerClose}
          label={t('actions.close')}
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
        />
      </HStack>
      <Box px="screen">
        <TextField
          testID={ids.pickerSearch}
          placeholder={t('picker.searchPlaceholder')}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          trailing={<Icon name="search" size={16} color="text2" />}
        />
      </Box>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <HStack testID={ids.pickerCategories} gap="xs" px="screen">
          {categories.map((c) => (
            <Chip
              key={c.key}
              testID={`${ids.pickerCategories}.${c.key}`}
              label={c.label}
              selected={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </HStack>
      </ScrollView>
      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        <Box px="screen" pb="md">
          <Pressable
            testID={ids.pickerCreate}
            onPress={() =>
              router.push(
                workoutsRoutes.exerciseNew({
                  name: query.trim() || undefined,
                  from: libMode ? undefined : 'picker',
                }),
              )
            }
            accessibilityLabel={t('picker.createNew')}
          >
            <HStack gap="md" borderColor="divider" style={styles.row}>
              <Box bg="brand" radius="full" align="center" justify="center" style={styles.plus}>
                <Icon name="plus" size={16} color="textOnBrand" />
              </Box>
              <VStack gap="xxs" flex={1}>
                <Text variant="cardTitleSm" color="brandText" numberOfLines={1}>
                  {q ? t('picker.create', { name: query.trim() }) : t('picker.createNew')}
                </Text>
                <Text variant="secondary" color="text2">
                  {t('picker.createHint')}
                </Text>
              </VStack>
            </HStack>
          </Pressable>
          <VStack testID={ids.pickerItems} gap="none">
            {list.map((l) => {
              const on = selection.includes(l.id);
              const rowId = `${ids.pickerItems}.${l.slug}`;
              return (
                <Pressable
                  key={l.id}
                  testID={rowId}
                  onPress={() =>
                    libMode ? router.push(workoutsRoutes.exercise(l.id)) : toggle(l.id)
                  }
                  accessibilityLabel={l.name}
                  accessibilityState={libMode ? undefined : { selected: on }}
                >
                  <HStack gap="md" borderColor="divider" style={styles.row}>
                    <VStack gap="xxs" flex={1}>
                      <Text variant="cardTitleSm">{l.name}</Text>
                      <Text variant="secondary" color="text2">
                        {subtitle(l)}
                      </Text>
                    </VStack>
                    {libMode ? (
                      <Icon name="chevron-right" size={16} color="text3" />
                    ) : (
                      <CheckCircle
                        testID={`${ids.pickerItems}.${l.slug}.check`}
                        checked={on}
                        color="ink"
                        size={28}
                      />
                    )}
                  </HStack>
                </Pressable>
              );
            })}
          </VStack>
          <QueryState
            testID={ids.pickerItems}
            loading={libraryQuery.isLoading}
            error={libraryQuery.error}
            onRetry={() => void libraryQuery.refetch()}
          />
          {libraryQuery.isSuccess && list.length === 0 ? (
            <Box py="2xl">
              <Text testID={ids.pickerEmpty} variant="small" color="text2" align="center">
                {t('picker.empty')}
              </Text>
            </Box>
          ) : null}
        </Box>
      </ScrollView>
    </Screen>
  );
}

const styles = {
  footer: { borderTopWidth: 1 } as const,
  chips: { flexGrow: 0 } as const,
  list: { flex: 1 } as const,
  row: { minHeight: 62, borderBottomWidth: 1 } as const,
  plus: { width: 28, height: 28 } as const,
};
