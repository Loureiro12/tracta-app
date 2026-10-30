import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  Divider,
  HStack,
  Icon,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionLabel,
  Text,
  VStack,
} from '@tracta/design-system';

import { now } from '@/shared/clock';
import { formatDate, useTranslation } from '@/shared/i18n';

import { useExerciseLibrary } from '../api/useExercises';
import { useEnrollment, useRace } from '../api/usePrograms';
import { useRoutines } from '../api/useRoutines';
import { ActivityTile } from '../components/ActivityTile';
import { QueryState } from '../components/QueryState';
import { dayKey, parseIsoDate } from '../model/workouts.days';
import { countSets, formatClock, raceView, weekPlan } from '../model/workouts.helpers';
import { recentPaceSeconds } from '../model/workouts.mock';
import { workoutsRoutes } from '../model/workouts.routes';
import { workoutsIds as ids } from '../workouts.testids';

type Props = {
  /** `new` previews the screen as a new user (no routines yet), like the prototype demo state. */
  scenario?: 'default' | 'new';
};

/** Monday-based weekday index of the app clock's today. */
function todayIndex(): number {
  return (now().getDay() + 6) % 7;
}

/** Treinos tab: week strip, activity starters, planning (programs/race) and routines. */
export function WorkoutsScreen({ scenario = 'default' }: Props) {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const routinesQuery = useRoutines();
  const allRoutines = routinesQuery.data ?? [];
  const { data: activeProgram, program } = useEnrollment();
  const race = useRace().data ?? null;
  const library = useExerciseLibrary().data ?? [];
  const customCount = library.filter((e) => e.custom).length;

  const visibleRoutines = scenario === 'new' ? [] : allRoutines;
  const routinesLoaded = scenario === 'new' || routinesQuery.isSuccess;
  const plan = weekPlan(allRoutines, program);
  const todayToken = program?.pattern[todayIndex()];
  const todayRoutine = allRoutines.find((r) => r.label === todayToken);
  const todayWorkout = todayRoutine
    ? `${todayRoutine.name} · ${todayRoutine.focus}`
    : todayToken === 'F'
      ? t('planning.fullBody')
      : todayToken === '⟶'
        ? t('planning.run')
        : null;

  const rv = race ? raceView(race, recentPaceSeconds) : null;
  const raceStats = rv
    ? [
        {
          key: 'target',
          label: t('race.targetPace'),
          value: `${formatClock(rv.requiredPace)} /km`,
        },
        {
          key: 'recent',
          label: t('race.recentPace'),
          value: `${formatClock(recentPaceSeconds)} /km`,
        },
        { key: 'estimate', label: t('race.estimate'), value: formatClock(rv.estimate) },
      ]
    : [];
  const raceLine =
    race && rv
      ? [
          formatDate(rv.date, { day: 'numeric', month: 'short' }),
          t('race.goalLine', { time: formatClock(race.goal) }),
          rv.diff <= 0
            ? t('race.onTrack')
            : t('race.paceGap', { time: formatClock(rv.diff / race.km) }),
        ].join(' · ')
      : t('race.empty');

  return (
    <Screen
      testID={ids.screen}
      bottomInset="tab"
      header={
        <ScreenHeader
          testID={ids.header}
          title={t('title')}
          actions={
            <Button
              testID={ids.newRoutine}
              label={t('new')}
              variant="secondary"
              size="xs"
              onPress={() => router.push(workoutsRoutes.builder())}
            />
          }
        />
      }
    >
      <VStack gap="sm">
        <SectionLabel>{t('week.title')}</SectionLabel>
        <HStack testID={ids.week} gap="xs" align="stretch">
          {plan.map((p, i) => (
            <Box
              key={i}
              testID={`${ids.week}.${i}`}
              flex={1}
              radius="md"
              py="sm"
              align="center"
              gap="xs"
              bg={i === 0 ? 'ink' : 'surface'}
            >
              <Text variant="captionSemibold" color={i === 0 ? 'textOnInk' : 'text'}>
                {t(dayKey(i))}
              </Text>
              <Text variant="bodyBold" color={i === 0 ? 'textOnInk' : p === '—' ? 'text3' : 'text'}>
                {p}
              </Text>
            </Box>
          ))}
        </HStack>
        <Text variant="caption" color="text2">
          {t('week.hint')}
        </Text>
      </VStack>

      <SectionLabel>{t('start.title')}</SectionLabel>
      <VStack gap="sm">
        <HStack gap="sm" align="stretch">
          <Box flex={1}>
            <ActivityTile
              testID={ids.startRun}
              title={t('modality.run.label')}
              description={t('modality.run.description')}
              onPress={() => router.push(workoutsRoutes.run('run'))}
            />
          </Box>
          <Box flex={1}>
            <ActivityTile
              testID={ids.startWalk}
              title={t('modality.walk.label')}
              description={t('modality.walk.description')}
              onPress={() => router.push(workoutsRoutes.run('walk'))}
            />
          </Box>
        </HStack>
        <HStack gap="sm" align="stretch">
          <Box flex={1}>
            <ActivityTile
              testID={ids.startFree}
              title={t('start.free')}
              description={t('start.freeDescription')}
              onPress={() => router.push(workoutsRoutes.session())}
            />
          </Box>
          <Box flex={1}>
            <ActivityTile
              testID={ids.startOthers}
              title={t('start.others')}
              description={t('start.othersDescription')}
              onPress={() => router.push(workoutsRoutes.modalities())}
            />
          </Box>
        </HStack>
        <Card
          testID={ids.startIntervals}
          onPress={() => router.push(workoutsRoutes.intervals())}
          padding="lg"
          py="ml"
          radius="pill"
          gap="none"
        >
          <HStack justify="space-between" gap="sm">
            <VStack gap="xs" flex={1}>
              <Text variant="subtitle">{t('start.intervals')}</Text>
              <Text variant="caption" color="text2">
                {t('start.intervalsDescription')}
              </Text>
            </VStack>
            <Icon name="chevron-right" size={16} color="text3" />
          </HStack>
        </Card>
      </VStack>

      <SectionLabel>{t('planning.title')}</SectionLabel>
      {program && activeProgram ? (
        <Card
          testID={ids.programActive}
          variant="ink"
          onPress={() => router.push(workoutsRoutes.programs(program.id))}
          gap="sm"
        >
          <HStack justify="space-between" gap="sm">
            <Text variant="caption" color="text2OnInk">
              {t('planning.activeProgram')}
            </Text>
            <Text variant="caption" color="text2OnInk">
              {t('planning.weekOf', {
                week: activeProgram.week,
                total: program.weeks,
                title: program.weekTitles[activeProgram.week - 1] ?? '',
              })}
            </Text>
          </HStack>
          <Text variant="nameTitle" color="textOnInk">
            {program.name}
          </Text>
          <ProgressBar value={activeProgram.week / program.weeks} color="brandOnDark" track="ink" />
          <Text variant="secondary" color="text2OnInk">
            {todayWorkout ? t('planning.today', { workout: todayWorkout }) : t('planning.restDay')}
          </Text>
        </Card>
      ) : (
        <Card
          testID={ids.programsCard}
          onPress={() => router.push(workoutsRoutes.programs())}
          padding="lg"
          radius="pill"
          gap="none"
        >
          <HStack justify="space-between" gap="sm">
            <VStack gap="xs" flex={1}>
              <Text variant="subtitle">{t('planning.programs')}</Text>
              <Text variant="caption" color="text2">
                {t('planning.programsDescription')}
              </Text>
            </VStack>
            <Icon name="chevron-right" size={16} color="text3" />
          </HStack>
        </Card>
      )}
      <Card
        testID={ids.raceCard}
        onPress={() => router.push(workoutsRoutes.race())}
        padding="lg"
        radius="pill"
        gap="sm"
      >
        <HStack justify="space-between" gap="sm">
          <Text variant="subtitle" numberOfLines={1}>
            {race ? t('race.titleWith', { distance: race.distance }) : t('race.title')}
          </Text>
          <Text testID={ids.raceChip} variant="captionBold" color="brandText">
            {race && rv ? t('race.daysLeft', { count: rv.days }) : t('race.define')}
          </Text>
        </HStack>
        <Text variant="secondary" color="text2">
          {raceLine}
        </Text>
        {race && rv ? (
          <VStack gap="sm" testID={ids.raceStats}>
            <Divider />
            <HStack gap="sm" align="flex-start">
              {raceStats.map((s) => (
                <VStack key={s.key} gap="xxs" flex={1}>
                  <Text variant="micro" color="text2" numberOfLines={1}>
                    {s.label}
                  </Text>
                  <Text variant="subtitle" tabular numberOfLines={1}>
                    {s.value}
                  </Text>
                </VStack>
              ))}
            </HStack>
          </VStack>
        ) : null}
      </Card>

      <SectionLabel>{t('routines.title')}</SectionLabel>
      {scenario === 'new' ? null : (
        <QueryState
          testID={ids.routines}
          loading={routinesQuery.isLoading}
          error={routinesQuery.error}
          onRetry={() => void routinesQuery.refetch()}
        />
      )}
      {routinesLoaded && visibleRoutines.length === 0 ? (
        <Box
          testID={ids.routinesEmpty}
          radius="card"
          borderColor="dividerStrong"
          borderWidth={1.5}
          px="screen"
          py="2xl"
          align="center"
          gap="sm"
          style={styles.dashed}
        >
          <Text variant="cardTitle" align="center">
            {t('routines.emptyTitle')}
          </Text>
          <Text variant="secondary" color="text2" align="center">
            {t('routines.emptyText')}
          </Text>
          <HStack gap="sm" pt="sm">
            <Button
              testID={ids.routinesEmptyCreate}
              label={t('routines.emptyCreate')}
              size="sm"
              shape="rounded"
              onPress={() => router.push(workoutsRoutes.builder())}
            />
            <Button
              testID={ids.routinesEmptyPrograms}
              label={t('routines.emptyPrograms')}
              variant="secondary"
              size="sm"
              shape="rounded"
              onPress={() => router.push(workoutsRoutes.programs())}
            />
          </HStack>
        </Box>
      ) : null}
      <VStack testID={ids.routines} gap="md">
        {visibleRoutines.map((r) => (
          <Card
            key={r.id}
            testID={`${ids.routines}.${r.label}`}
            onPress={() => router.push(workoutsRoutes.detail(r.id))}
            padding="lg"
            px="xl"
            gap="none"
          >
            <HStack gap="ml">
              <Box bg="fill1" radius="lg" align="center" justify="center" style={styles.letter}>
                <Text variant="nameTitle" color="brandText">
                  {r.label}
                </Text>
              </Box>
              <VStack gap="xxs" flex={1}>
                <Text variant="cardTitleSm" numberOfLines={1}>
                  {`${r.name} · ${r.focus}`}
                </Text>
                <Text variant="secondary" color="text2">
                  {t('routines.meta', {
                    exercises: r.exercises.length,
                    sets: countSets(r.exercises),
                    minutes: r.estMinutes,
                  })}
                </Text>
                <Text variant="caption" color="text3">
                  {r.lastDoneAt
                    ? t('routines.last', {
                        date: formatDate(parseIsoDate(r.lastDoneAt), {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        }),
                      })
                    : t('routines.never')}
                </Text>
              </VStack>
              <Icon name="chevron-right" size={16} color="text3" />
            </HStack>
          </Card>
        ))}
      </VStack>
      <Card
        testID={ids.library}
        variant="outline"
        onPress={() => router.push(workoutsRoutes.picker('lib'))}
        padding="lg"
        px="xl"
        gap="none"
      >
        <HStack justify="space-between" gap="sm">
          <VStack gap="xxs" flex={1}>
            <Text variant="cardTitleSm">{t('library.title')}</Text>
            <Text variant="secondary" color="text2">
              {t('library.meta', {
                total: library.length,
                custom: customCount,
              })}
            </Text>
          </VStack>
          <Icon name="chevron-right" size={16} color="text3" />
        </HStack>
      </Card>
    </Screen>
  );
}

const styles = {
  letter: { width: 54, height: 54 } as const,
  dashed: { borderStyle: 'dashed' } as const,
};
