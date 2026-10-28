import { useRouter } from 'expo-router';

import { Box, Button, Card, HStack, Sheet, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { StepperTile } from '../components/StepperTile';
import { formatClock, intervalPhases } from '../model/workouts.helpers';
import { workoutsRoutes } from '../model/workouts.routes';
import { useWorkoutsStore } from '../model/workouts.store';
import { workoutsIds as ids } from '../workouts.testids';

import type { IntervalPhase } from '../model/workouts.helpers';
import type { IntervalsConfig } from '../model/workouts.types';
import type { SemanticColors } from '@tracta/design-system';

const PHASE_COLOR: Record<IntervalPhase['kind'], keyof SemanticColors> = {
  warm: 'warnText',
  work: 'danger',
  recover: 'brandText',
  cool: 'run',
};

/** Interval run sheet: reps / work / recovery / warm-up steppers and the proportional structure bar. */
export function IntervalsSheetScreen() {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const config = useWorkoutsStore((s) => s.intervals);
  const setIntervals = useWorkoutsStore((s) => s.setIntervals);
  const phases = intervalPhases(config);
  const total = phases.reduce((acc, p) => acc + p.seconds, 0);

  const adjust = (key: keyof IntervalsConfig, delta: number, min: number, max: number) => () =>
    setIntervals({ [key]: Math.max(min, Math.min(max, config[key] + delta)) });

  return (
    <Sheet
      testID={ids.intervalsScreen}
      title={t('intervals.title')}
      rightLabel={t('actions.close')}
      onClose={() => router.back()}
      footer={
        <Button
          testID={ids.intervalsStart}
          label={t('intervals.start')}
          size="lg"
          fullWidth
          onPress={() => router.replace(workoutsRoutes.run('intervals'))}
        />
      }
    >
      <Text variant="small" color="text2">
        {t('intervals.intro')}
      </Text>
      <HStack gap="sm" align="stretch">
        <StepperTile
          testID={ids.intervalsReps}
          label={t('intervals.reps')}
          valueLabel={t('intervals.repsValue', { count: config.reps })}
          onDecrement={adjust('reps', -1, 2, 20)}
          onIncrement={adjust('reps', 1, 2, 20)}
          bg="bg"
        />
        <StepperTile
          testID={ids.intervalsWork}
          label={t('intervals.work')}
          valueLabel={formatClock(config.work)}
          onDecrement={adjust('work', -15, 15, 600)}
          onIncrement={adjust('work', 15, 15, 600)}
          bg="bg"
        />
      </HStack>
      <HStack gap="sm" align="stretch">
        <StepperTile
          testID={ids.intervalsRest}
          label={t('intervals.rest')}
          valueLabel={formatClock(config.rest)}
          onDecrement={adjust('rest', -15, 15, 600)}
          onIncrement={adjust('rest', 15, 15, 600)}
          bg="bg"
        />
        <StepperTile
          testID={ids.intervalsWarm}
          label={t('intervals.warm')}
          valueLabel={formatClock(config.warm)}
          onDecrement={adjust('warm', -60, 0, 1200)}
          onIncrement={adjust('warm', 60, 0, 1200)}
          bg="bg"
        />
      </HStack>
      <Card testID={ids.intervalsStructure} variant="outline" padding="lg" radius="pill" gap="sm">
        <Text variant="secondarySemibold">{t('intervals.structure')}</Text>
        <Box direction="row" radius="xs" gap="xxs" style={styles.bar}>
          {phases.map((p, i) => (
            <Box key={i} flex={p.seconds} bg={PHASE_COLOR[p.kind]} />
          ))}
        </Box>
        <Text testID={ids.intervalsTotal} variant="secondary" color="text2">
          {t('intervals.total', {
            minutes: Math.round(total / 60),
            count: config.reps,
            time: formatClock(config.work),
          })}
        </Text>
      </Card>
    </Sheet>
  );
}

const styles = { bar: { height: 16, overflow: 'hidden' } as const };
