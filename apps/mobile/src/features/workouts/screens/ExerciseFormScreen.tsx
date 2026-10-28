import { useState } from 'react';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Pressable,
  Screen,
  Switch,
  Text,
  TextField,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { OverlayHeader } from '../components/OverlayHeader';
import { SelectChip } from '../components/SelectChip';
import { StepperTile } from '../components/StepperTile';
import { useWorkoutsData } from '../hooks/useWorkoutsData';
import { formatClock, formatKg, normalize } from '../model/workouts.helpers';
import { equipment, exerciseCategories, exerciseIdFromName } from '../model/workouts.mock';
import { useWorkoutsStore } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

import type { ExerciseType } from '../model/workouts.types';

type Props = {
  /** Prefilled name (from the picker search). */
  name?: string | undefined;
  /** Id of a custom exercise to edit. */
  edit?: string | undefined;
  /** When opened from the picker, the saved exercise is also selected there. */
  from?: 'picker' | undefined;
};

type FormState = {
  name: string;
  group: string;
  secondary: string[];
  equipment: string;
  type: ExerciseType;
  reps: number;
  kg: number;
  rest: number;
  notes: string;
  favorite: boolean;
};

const TIME_GROUPS = new Set(['Cardio', 'Mobilidade']);
const TYPES: ExerciseType[] = ['s', 'b', 'c'];

/** New / edit exercise form with chips for group, equipment and logging type plus default values. */
export function ExerciseFormScreen({ name, edit, from }: Props) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const showToast = useFeedbackStore((s) => s.showToast);
  const addUserExercise = useWorkoutsStore((s) => s.addUserExercise);
  const updateUserExercise = useWorkoutsStore((s) => s.updateUserExercise);
  const { library } = useWorkoutsData();
  const editing = edit ? library.find((l) => l.id === edit) : undefined;
  const [form, setForm] = useState<FormState>(() =>
    editing
      ? {
          name: editing.name,
          group: editing.group,
          secondary: editing.secondary,
          equipment: editing.equipment,
          type: editing.type,
          reps: editing.reps,
          kg: editing.kg ?? 20,
          rest: editing.rest || 60,
          notes: editing.notes,
          favorite: editing.favorite,
        }
      : {
          name: name ?? '',
          group: '',
          secondary: [],
          equipment: '',
          type: 's',
          reps: 10,
          kg: 20,
          rest: 60,
          notes: '',
          favorite: false,
        },
  );
  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));
  const step = (field: 'reps' | 'kg' | 'rest', delta: number, min: number, max: number) => () =>
    setForm((f) => ({
      ...f,
      [field]: Math.min(max, Math.max(min, Math.round((f[field] + delta) * 100) / 100)),
    }));

  const valid = Boolean(form.name.trim()) && Boolean(form.group);

  const save = () => {
    const trimmed = form.name.trim();
    if (!trimmed) return showToast(t('toast.exerciseNameRequired'));
    if (!form.group) return showToast(t('toast.groupRequired'));
    if (library.some((l) => normalize(l.name) === normalize(trimmed) && l.id !== editing?.id))
      return showToast(t('toast.duplicateExercise'));
    const data = {
      name: trimmed,
      group: form.group,
      secondary: form.secondary,
      equipment: form.equipment || 'Outro',
      type: form.type,
      kg: form.type === 's' ? form.kg : null,
      reps: form.reps,
      rest: form.type === 'c' ? 0 : form.rest,
      notes: form.notes,
      favorite: form.favorite,
    };
    if (editing) {
      updateUserExercise(editing.id, data);
    } else {
      const created = addUserExercise(data);
      if (from === 'picker') {
        const s = useWorkoutsStore.getState();
        s.setPickerSelection([...s.pickerSelection, created.id]);
      }
    }
    showToast(
      from === 'picker' && !editing
        ? t('toast.exerciseCreatedSelected')
        : t('toast.exerciseCreated'),
    );
    router.back();
  };

  const steppers =
    form.type === 'c'
      ? [
          {
            key: 'duration',
            testID: ids.formDuration,
            label: t('builder.duration'),
            value: t('copy.minutes', { count: form.reps }),
            minus: step('reps', -5, 5, 180),
            plus: step('reps', 5, 5, 180),
          },
        ]
      : [
          {
            key: 'reps',
            testID: ids.formReps,
            label: t('builder.reps'),
            value: String(form.reps),
            minus: step('reps', -1, 1, 50),
            plus: step('reps', 1, 1, 50),
          },
          ...(form.type === 's'
            ? [
                {
                  key: 'load',
                  testID: ids.formLoad,
                  label: t('form.load'),
                  value: t('copy.kg', { kg: formatKg(form.kg) }),
                  minus: step('kg', -2.5, 0, 500),
                  plus: step('kg', 2.5, 0, 500),
                },
              ]
            : []),
          {
            key: 'rest',
            testID: ids.formRest,
            label: t('builder.rest'),
            value: formatClock(form.rest),
            minus: step('rest', -15, 0, 600),
            plus: step('rest', 15, 0, 600),
          },
        ];
  const rows: (typeof steppers)[] = [];
  for (let i = 0; i < steppers.length; i += 2) rows.push(steppers.slice(i, i + 2));

  const section = (title: string, hint?: string) => (
    <HStack justify="space-between" gap="md">
      <Text variant="secondarySemibold">{title}</Text>
      {hint ? (
        <Text variant="caption" color="text2" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </HStack>
  );

  return (
    <Screen
      testID={ids.formScreen}
      header={
        <OverlayHeader
          title={editing ? t('form.titleEdit') : t('form.titleNew')}
          titleTestID={ids.formTitle}
          left={{
            label: t('builder.cancel'),
            onPress: () => router.back(),
            testID: ids.formCancel,
          }}
        />
      }
      footer={
        <Box px="screen" pt="md" pb="2xl" bg="bg" borderColor="divider" style={styles.footer}>
          <Button
            testID={ids.formSave}
            label={t('form.save')}
            variant={valid ? 'primary' : 'secondary'}
            size="xl"
            fullWidth
            onPress={save}
          />
        </Box>
      }
    >
      <VStack gap="xl">
        <TextField
          testID={ids.formName}
          placeholder={t('form.namePlaceholder')}
          value={form.name}
          onChangeText={(v) => patch({ name: v })}
        />
        <VStack gap="sm">
          {section(t('form.group'), t('form.required'))}
          <HStack testID={ids.formGroups} gap="xs" wrap="wrap">
            {exerciseCategories.map((g) => (
              <SelectChip
                key={g}
                testID={`${ids.formGroups}.${exerciseIdFromName(g)}`}
                label={g}
                selected={form.group === g}
                onPress={() =>
                  patch({
                    group: g,
                    secondary: form.secondary.filter((s) => s !== g),
                    ...(TIME_GROUPS.has(g) ? { type: 'c' as const, reps: 10 } : {}),
                  })
                }
              />
            ))}
          </HStack>
        </VStack>
        <VStack gap="sm">
          {section(t('form.secondary'), t('builder.optional'))}
          <HStack testID={ids.formSecondary} gap="xs" wrap="wrap">
            {exerciseCategories
              .filter((g) => g !== form.group && !TIME_GROUPS.has(g))
              .map((g) => (
                <SelectChip
                  key={g}
                  testID={`${ids.formSecondary}.${exerciseIdFromName(g)}`}
                  label={g}
                  selected={form.secondary.includes(g)}
                  onPress={() =>
                    patch({
                      secondary: form.secondary.includes(g)
                        ? form.secondary.filter((s) => s !== g)
                        : [...form.secondary, g],
                    })
                  }
                />
              ))}
          </HStack>
        </VStack>
        <VStack gap="sm">
          {section(t('form.equipment'))}
          <HStack testID={ids.formEquipment} gap="xs" wrap="wrap">
            {equipment.map((eq) => (
              <SelectChip
                key={eq}
                testID={`${ids.formEquipment}.${exerciseIdFromName(eq)}`}
                label={eq}
                selected={form.equipment === eq}
                onPress={() =>
                  patch({
                    equipment: eq,
                    ...(eq === 'Peso corporal' && form.type === 's' ? { type: 'b' as const } : {}),
                  })
                }
              />
            ))}
          </HStack>
        </VStack>
        <VStack gap="sm">
          {section(t('form.type'))}
          <HStack testID={ids.formTypes} gap="xs" align="stretch">
            {TYPES.map((k) => {
              const on = form.type === k;
              return (
                <Box key={k} flex={1}>
                  <Pressable
                    testID={`${ids.formTypes}.${k}`}
                    onPress={() =>
                      patch({
                        type: k,
                        ...(k === 'c' ? { reps: Math.max(5, Math.round(form.reps / 5) * 5) } : {}),
                      })
                    }
                    accessibilityLabel={t(`form.types.${k}.label`)}
                    accessibilityState={{ selected: on }}
                  >
                    <Box
                      bg={on ? 'ink' : 'surface'}
                      borderWidth={1}
                      borderColor={on ? 'ink' : 'outline'}
                      radius="md"
                      px="sm"
                      py="sm"
                      justify="center"
                      gap="xxs"
                      style={styles.type}
                    >
                      <Text variant="secondaryBold" color={on ? 'textOnInk' : 'text'}>
                        {t(`form.types.${k}.label`)}
                      </Text>
                      <Text variant="micro" color={on ? 'text2OnInk' : 'text2'}>
                        {t(`form.types.${k}.sub`)}
                      </Text>
                    </Box>
                  </Pressable>
                </Box>
              );
            })}
          </HStack>
        </VStack>
        <VStack gap="sm">
          {section(t('form.defaults'), t('form.defaultsHint'))}
          {rows.map((row, r) => (
            <HStack key={r} gap="sm" align="stretch">
              {row.map((s) => (
                <StepperTile
                  key={s.key}
                  testID={s.testID}
                  label={s.label}
                  valueLabel={s.value}
                  onDecrement={s.minus}
                  onIncrement={s.plus}
                />
              ))}
              {row.length === 1 ? <Box flex={1} /> : null}
            </HStack>
          ))}
        </VStack>
        <VStack gap="sm">
          {section(t('form.notes'), t('builder.optional'))}
          <TextField
            testID={ids.formNotes}
            placeholder={t('form.notesPlaceholder')}
            value={form.notes}
            onChangeText={(v) => patch({ notes: v })}
            multiline
          />
        </VStack>
        <Card padding="lg" radius="lg" gap="none">
          <HStack justify="space-between" gap="md">
            <VStack gap="xxs" flex={1}>
              <Text variant="bodySemibold">{t('form.favorite')}</Text>
              <Text variant="caption" color="text2">
                {t('form.favoriteHint')}
              </Text>
            </VStack>
            <Switch
              testID={ids.formFavorite}
              value={form.favorite}
              onValueChange={(favorite) => patch({ favorite })}
              accessibilityLabel={t('form.favorite')}
            />
          </HStack>
        </Card>
      </VStack>
    </Screen>
  );
}

const styles = {
  footer: { borderTopWidth: 1 } as const,
  type: { minHeight: 64 } as const,
};
