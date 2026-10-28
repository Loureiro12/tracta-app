import { Box, HStack, Icon, Pressable, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { StepperTile } from './StepperTile';
import { ToneButton } from './ToneButton';
import { formatClock, formatKg } from '../model/workouts.helpers';

import type { DraftExercise } from '../model/workouts.types';

export type StepField = 'sets' | 'reps' | 'kg' | 'rest';

type Props = {
  testID: string;
  index: number;
  total: number;
  exercise: DraftExercise;
  open: boolean;
  summary: string;
  onToggle: () => void;
  onAdjust: (field: StepField, delta: number, min: number, max: number) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onSuperset: () => void;
};

/** Expandable exercise row of the builder: steppers, superset toggle, reorder and remove. */
export function BuilderExerciseRow({
  testID,
  index,
  total,
  exercise: e,
  open,
  summary,
  onToggle,
  onAdjust,
  onMove,
  onRemove,
  onSuperset,
}: Props) {
  const { t } = useTranslation('workouts');

  const steppers = e.cardio
    ? [
        {
          key: 'duration',
          label: t('builder.duration'),
          value: t('copy.minutes', { count: e.reps }),
          minus: () => onAdjust('reps', -5, 5, 180),
          plus: () => onAdjust('reps', 5, 5, 180),
        },
      ]
    : [
        {
          key: 'sets',
          label: t('builder.sets'),
          value: String(e.sets),
          minus: () => onAdjust('sets', -1, 1, 12),
          plus: () => onAdjust('sets', 1, 1, 12),
        },
        {
          key: 'reps',
          label: t('builder.reps'),
          value: String(e.reps),
          minus: () => onAdjust('reps', -1, 1, 50),
          plus: () => onAdjust('reps', 1, 1, 50),
        },
        ...(e.kg != null
          ? [
              {
                key: 'load',
                label: t('builder.load'),
                value: t('copy.kg', { kg: formatKg(e.kg) }),
                minus: () => onAdjust('kg', -2.5, 0, 500),
                plus: () => onAdjust('kg', 2.5, 0, 500),
              },
            ]
          : []),
        {
          key: 'rest',
          label: t('builder.rest'),
          value: formatClock(e.rest),
          minus: () => onAdjust('rest', -15, 0, 600),
          plus: () => onAdjust('rest', 15, 0, 600),
        },
      ];
  const rows: (typeof steppers)[] = [];
  for (let i = 0; i < steppers.length; i += 2) rows.push(steppers.slice(i, i + 2));

  const canSuperset = !e.cardio && (index < total - 1 || Boolean(e.superset));
  const sub =
    `${e.group} · ${e.equipment}` + (e.prev.length ? ` · ${t('builder.lastSessionLoad')}` : '');

  return (
    <Box
      testID={testID}
      bg="surface"
      radius="pill"
      borderWidth={1}
      borderColor={open ? 'ink' : 'divider'}
      style={styles.clip}
    >
      <Pressable testID={`${testID}.toggle`} onPress={onToggle} accessibilityLabel={e.name}>
        <HStack gap="md" px="lg" py="ml">
          <Box bg="fill1" radius="full" align="center" justify="center" style={styles.badge}>
            <Text variant="secondaryBold">{String(index + 1)}</Text>
          </Box>
          <VStack gap="xxs" flex={1}>
            <Text variant="cardTitleSm">{e.name}</Text>
            <Text testID={`${testID}.summary`} variant="secondary" color="text2" tabular>
              {summary}
            </Text>
          </VStack>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="text3" />
        </HStack>
      </Pressable>
      {open ? (
        <VStack px="lg" pb="lg" gap="md">
          <Text variant="caption" color="text2">
            {sub}
          </Text>
          {rows.map((row, r) => (
            <HStack key={r} gap="sm" align="stretch">
              {row.map((s) => (
                <StepperTile
                  key={s.key}
                  testID={`${testID}.${s.key}`}
                  label={s.label}
                  valueLabel={s.value}
                  onDecrement={s.minus}
                  onIncrement={s.plus}
                  bg="bg"
                />
              ))}
              {row.length === 1 ? <Box flex={1} /> : null}
            </HStack>
          ))}
          {canSuperset ? (
            <HStack>
              <ToneButton
                testID={`${testID}.superset`}
                label={e.superset ? t('builder.supersetUndo') : t('builder.supersetNext')}
                bg={e.superset ? 'socialBg' : 'fill1'}
                color={e.superset ? 'social' : 'text'}
                onPress={onSuperset}
              />
            </HStack>
          ) : null}
          <HStack gap="sm">
            <ToneButton
              testID={`${testID}.up`}
              label={t('builder.moveUp')}
              dimmed={index === 0}
              onPress={() => onMove(-1)}
            />
            <ToneButton
              testID={`${testID}.down`}
              label={t('builder.moveDown')}
              dimmed={index === total - 1}
              onPress={() => onMove(1)}
            />
            <ToneButton
              testID={`${testID}.remove`}
              label={t('builder.remove')}
              color="danger"
              onPress={onRemove}
            />
          </HStack>
        </VStack>
      ) : null}
    </Box>
  );
}

const styles = {
  clip: { overflow: 'hidden' } as const,
  badge: { width: 28, height: 28 } as const,
};
