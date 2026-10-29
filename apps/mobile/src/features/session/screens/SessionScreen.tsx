import { useLayoutEffect, useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Heading,
  Icon,
  Pressable,
  Screen,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { useSessionRoutine } from '../api/useSessionRoutine';
import { ActiveSetCard } from '../components/ActiveSetCard';
import { ExercisePills } from '../components/ExercisePills';
import { SessionHeader } from '../components/SessionHeader';
import { SetRow } from '../components/SetRow';
import { WarmupRow } from '../components/WarmupRow';
import { useSessionTicker } from '../hooks/useSessionTicker';
import {
  FREE_ROUTINE_ID,
  KG_STEP,
  activeSetIndex,
  allSetsDone,
  clock,
  countSets,
  shouldOfferWarmup,
  suggestionFor,
  warmupSets,
} from '../model/session.logic';
import { sessionRoutes } from '../model/session.routes';
import { useSessionStore } from '../model/session.store';
import { sessionIds } from '../session.testids';

import type { SessionExercise } from '../model/session.types';
import type { ViewStyle } from 'react-native';

type Props = {
  /** Routine id (or letter) to start when no session is active (default: today's routine). */
  routine?: string | undefined;
  /** Start an empty "free session" instead of a routine. */
  free?: boolean;
};

const kg = (value: number | null) =>
  value == null ? '' : formatNumber(value, { maximumFractionDigits: 2 });

/** Full-screen strength session: header with timer, exercise pills, set rows and the main CTA. */
export function SessionScreen({ routine, free = false }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('session');
  const showToast = useFeedbackStore((s) => s.showToast);
  const setMiniPlayer = useFeedbackStore((s) => s.setMiniPlayer);

  const session = useSessionStore((s) => s.session);
  const startSession = useSessionStore((s) => s.startSession);
  const togglePause = useSessionStore((s) => s.togglePause);
  const resume = useSessionStore((s) => s.resume);
  const selectExercise = useSessionStore((s) => s.selectExercise);
  const prevExercise = useSessionStore((s) => s.prevExercise);
  const nextExercise = useSessionStore((s) => s.nextExercise);
  const adjustSet = useSessionStore((s) => s.adjustSet);
  const toggleSet = useSessionStore((s) => s.toggleSet);
  const addSet = useSessionStore((s) => s.addSet);
  const removeSet = useSessionStore((s) => s.removeSet);
  const completeActiveSet = useSessionStore((s) => s.completeActiveSet);
  const applySuggestion = useSessionStore((s) => s.applySuggestion);
  const dismissSuggestion = useSessionStore((s) => s.dismissSuggestion);
  const addWarmup = useSessionStore((s) => s.addWarmup);
  const skipWarmup = useSessionStore((s) => s.skipWarmup);
  const toggleWarmup = useSessionStore((s) => s.toggleWarmup);
  const openPlates = useSessionStore((s) => s.openPlates);
  const finish = useSessionStore((s) => s.finish);

  // Opening the screen (deep link, routine detail or the mini-player) starts or resumes the session.
  // A routine session needs its prescription and last sets from the backend first.
  const routineQuery = useSessionRoutine(routine, !session && !free);
  const loadedRoutine = routineQuery.data;
  useLayoutEffect(() => {
    setMiniPlayer(null);
  }, [setMiniPlayer]);
  useLayoutEffect(() => {
    if (free) startSession(null);
    else if (loadedRoutine) startSession(loadedRoutine);
  }, [startSession, free, loadedRoutine]);
  useSessionTicker();

  const footerStyle = useMemo<ViewStyle>(
    () => ({
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing['3xl'],
      flexDirection: 'row',
      gap: theme.spacing.sm,
    }),
    [theme],
  );
  const navButtonStyle = useMemo<ViewStyle>(
    () => ({
      width: 54,
      height: 60,
      borderRadius: theme.radii.xl,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [theme],
  );

  if (!session) {
    const failed = routineQuery.isError || (routineQuery.isSuccess && !loadedRoutine);
    return (
      <Screen testID={sessionIds.screen} scroll={false}>
        {failed ? (
          <Card testID={`${sessionIds.screen}.error`} padding="xl" gap="sm">
            <Text variant="bodySemibold">
              {routineQuery.isError ? t('state.errorTitle') : t('state.noRoutine')}
            </Text>
            <Button
              testID={`${sessionIds.screen}.error.retry`}
              label={routineQuery.isError ? t('state.retry') : t('state.back')}
              variant="surface"
              size="sm"
              onPress={() =>
                routineQuery.isError
                  ? void routineQuery.refetch()
                  : router.replace(sessionRoutes.home())
              }
            />
          </Card>
        ) : (
          <Box />
        )}
      </Screen>
    );
  }

  const exercise: SessionExercise | undefined = session.exercises[session.exerciseIndex];
  const empty = session.exercises.length === 0;
  const activeIdx = exercise ? activeSetIndex(exercise) : -1;
  const done = allSetsDone(session);
  const suggestion = exercise ? suggestionFor(exercise) : null;
  const offerWarmup = exercise ? shouldOfferWarmup(exercise) : false;
  const name = session.routineId === FREE_ROUTINE_ID ? t('header.freeName') : session.name;
  const focus = session.routineId === FREE_ROUTINE_ID ? t('header.freeFocus') : session.focus;

  const prevLabel = (index: number): string => {
    const p = exercise?.prev[index];
    if (!p) return t('set.none');
    return exercise?.bodyweight
      ? t('set.prevReps', { reps: p[1] })
      : t('set.prevKg', { kg: kg(p[0]), reps: p[1] });
  };
  const setSummary = (set: SessionExercise['sets'][number]): string => {
    if (!exercise?.bodyweight) return t('set.summaryKg', { kg: kg(set.kg), reps: set.reps });
    return exercise.cardio
      ? t('set.summaryMin', { reps: set.reps })
      : t('set.summaryReps', { reps: set.reps });
  };
  const prevLine = exercise?.prev.length
    ? t('exercise.lastTime', {
        sets: exercise.prev
          .map((p) => (exercise.bodyweight ? String(p[1]) : `${kg(p[0])}×${p[1]}`))
          .join(', '),
      })
    : t('exercise.firstTime');
  const supersetWith = exercise?.superset
    ? session.exercises
        .filter((x) => x.superset === exercise.superset && x.id !== exercise.id)
        .map((x) => x.name)
        .join(', ')
    : '';
  const ctaLabel = empty
    ? t('cta.addExercise')
    : done
      ? t('cta.review')
      : activeIdx < 0
        ? t('cta.nextExercise')
        : t('cta.completeSet', { num: activeIdx + 1 });

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(sessionRoutes.home());
  };
  const goSummary = () => {
    finish();
    router.push(sessionRoutes.summary());
  };
  const minimize = () => {
    const counts = countSets(session);
    setMiniPlayer({
      title: t('mini.title', { name, time: clock(session.elapsedSec) }),
      subtitle: exercise
        ? t('mini.subtitle', {
            name: exercise.name,
            num: Math.min(exercise.sets.length, Math.max(activeIdx, 0) + 1),
            total: exercise.sets.length,
          })
        : t('mini.subtitle', { name, num: counts.done, total: counts.total }),
      href: '/session',
    });
    goBack();
  };
  const mainAction = () => {
    if (empty) {
      showToast(t('actions.pickerSoon'));
      return;
    }
    if (done) {
      goSummary();
      return;
    }
    const result = completeActiveSet();
    if (result === 'rest') router.push(sessionRoutes.rest());
    else if (result === 'all-done') showToast(t('actions.allDone'));
    else if (result === 'finished') router.push(sessionRoutes.summary());
  };

  return (
    <Screen
      testID={sessionIds.screen}
      header={
        <>
          <SessionHeader
            subtitle={t('header.subtitle', { name, focus })}
            elapsed={clock(session.elapsedSec)}
            paused={session.paused}
            onMinimize={minimize}
            onTogglePause={togglePause}
          />
          <ExercisePills
            exercises={session.exercises}
            current={session.exerciseIndex}
            onSelect={selectExercise}
          />
          {session.paused ? (
            <Box px="screen" pt="sm">
              <Box
                testID={sessionIds.pausedBanner}
                bg="warnBg"
                radius="md"
                px="ml"
                py="sm"
                direction="row"
                align="center"
                justify="space-between"
              >
                <Text variant="secondarySemibold" color="warnText">
                  {t('paused.text')}
                </Text>
                <Pressable
                  testID={sessionIds.pausedResume}
                  onPress={resume}
                  accessibilityLabel={t('paused.resume')}
                  style={styles.resume}
                >
                  <Text variant="secondaryBold" color="warnText">
                    {t('paused.resume')}
                  </Text>
                </Pressable>
              </Box>
            </Box>
          ) : null}
        </>
      }
      footer={
        <Box style={footerStyle}>
          <Pressable
            testID={sessionIds.navPrev}
            onPress={prevExercise}
            accessibilityLabel={t('actions.prev')}
            style={navButtonStyle}
          >
            <Icon name="chevron-left" size={20} />
          </Pressable>
          <Box flex={1}>
            <Button
              testID={sessionIds.navMain}
              label={ctaLabel}
              size="xl"
              fullWidth
              onPress={mainAction}
            />
          </Box>
          <Pressable
            testID={sessionIds.navNext}
            onPress={nextExercise}
            accessibilityLabel={t('actions.next')}
            style={navButtonStyle}
          >
            <Icon name="chevron-right" size={20} />
          </Pressable>
        </Box>
      }
    >
      {exercise ? (
        <Text testID={sessionIds.exerciseMeta} variant="secondary" color="text2">
          {t('exercise.meta', {
            num: session.exerciseIndex + 1,
            total: session.exercises.length,
            group: exercise.group,
          })}
        </Text>
      ) : null}
      <Heading testID={sessionIds.exerciseName} level={1}>
        {exercise ? exercise.name : t('exercise.none')}
      </Heading>
      {exercise?.superset ? (
        <Box align="flex-start">
          <Box bg="socialBg" radius="xs" px="sm" py="xs">
            <Text testID={sessionIds.superset} variant="captionBold" color="social">
              {t('exercise.superset', { names: supersetWith })}
            </Text>
          </Box>
        </Box>
      ) : null}
      {exercise ? (
        <Text variant="secondary" color="text2">
          {t('exercise.info', {
            equipment: exercise.equipment,
            rest: clock(exercise.restSec),
            prev: prevLine,
          })}
        </Text>
      ) : null}

      {suggestion ? (
        <Card testID={sessionIds.suggestion} variant="tint" radius="xl" padding="lg" gap="sm">
          <Text variant="captionBold" color="brandText" uppercase>
            {t('suggestion.label')}
          </Text>
          <Text variant="small">
            {t('suggestion.text', {
              reps: suggestion.targetReps,
              from: kg(suggestion.from),
              to: kg(suggestion.to),
            })}
          </Text>
          <HStack gap="sm">
            <Box flex={1}>
              <Button
                testID={sessionIds.suggestionApply}
                label={t('suggestion.use', { kg: kg(suggestion.to) })}
                size="sm"
                fullWidth
                onPress={applySuggestion}
              />
            </Box>
            <Box flex={1}>
              <Button
                testID={sessionIds.suggestionKeep}
                label={t('suggestion.keep', { kg: kg(suggestion.from) })}
                variant="onInk"
                size="sm"
                fullWidth
                onPress={dismissSuggestion}
              />
            </Box>
          </HStack>
        </Card>
      ) : null}

      {empty ? (
        <Card padding="2xl" gap="xs">
          <Text variant="cardTitleSm">{t('empty.title')}</Text>
          <Text variant="secondary" color="text2">
            {t('empty.body')}
          </Text>
        </Card>
      ) : null}

      {exercise && offerWarmup ? (
        <Card testID={sessionIds.warmupOffer} radius="xl" padding="ml" gap="none">
          <HStack gap="md">
            <Box flex={1} gap="xxs">
              <Text variant="smallBold" numberOfLines={1}>
                {t('warmup.title')}
              </Text>
              <Text variant="caption" color="text2">
                {warmupSets(exercise.sets[0]?.kg ?? 0)
                  .map((w) => `${kg(w.kg)}×${w.reps}`)
                  .join(' · ')}{' '}
                {t('set.kgUnit')}
              </Text>
            </Box>
            <HStack gap="xs">
              <Button
                testID={sessionIds.warmupSkip}
                label={t('warmup.skip')}
                variant="ghost"
                size="sm"
                onPress={skipWarmup}
              />
              <Button
                testID={sessionIds.warmupAdd}
                label={t('warmup.add')}
                size="sm"
                onPress={addWarmup}
              />
            </HStack>
          </HStack>
        </Card>
      ) : null}

      {exercise?.warmup?.length ? (
        <VStack testID={sessionIds.warmupRow} gap="xs" pt="xs">
          <Text variant="captionBold" color="warnText" uppercase>
            {t('warmup.label')}
          </Text>
          {exercise.warmup.map((w, i) => (
            <WarmupRow
              key={i}
              index={i}
              label={t('warmup.row', { kg: kg(w.kg), reps: w.reps })}
              done={w.done}
              onToggle={() => toggleWarmup(i)}
            />
          ))}
        </VStack>
      ) : null}

      {exercise ? (
        <VStack testID={sessionIds.setRow} gap="sm" pt="xs">
          {exercise.sets.map((set, i) =>
            i === activeIdx ? (
              <ActiveSetCard
                key={i}
                num={i + 1}
                previous={prevLabel(i)}
                hasKg={!exercise.bodyweight}
                kgValue={kg(set.kg)}
                repsValue={String(set.reps)}
                repsUnit={exercise.cardio ? t('set.minUnit') : t('set.repsUnit')}
                isBar={exercise.equipment === 'Barra' && !exercise.bodyweight}
                onKg={(d) => adjustSet(i, 'kg', d * KG_STEP)}
                onReps={(d) => adjustSet(i, 'reps', d)}
                onPlates={() => {
                  openPlates(set.kg ?? 20);
                  router.push(sessionRoutes.plates());
                }}
              />
            ) : (
              <SetRow
                key={i}
                index={i}
                summary={setSummary(set)}
                previous={prevLabel(i)}
                done={set.done}
                onToggle={() => toggleSet(i)}
              />
            ),
          )}
        </VStack>
      ) : null}

      <VStack gap="sm" pt="xs">
        <Button
          testID={sessionIds.addExercise}
          label={t('actions.addExercise')}
          variant="onInk"
          size="sm"
          fullWidth
          onPress={() => showToast(t('actions.pickerSoon'))}
        />
        <HStack gap="sm">
          <Box flex={1}>
            <Button
              testID={sessionIds.addSet}
              label={t('actions.addSet')}
              variant="onInk"
              size="sm"
              fullWidth
              onPress={addSet}
            />
          </Box>
          <Box flex={1}>
            <Button
              testID={sessionIds.removeSet}
              label={t('actions.removeSet')}
              variant="onInk"
              size="sm"
              fullWidth
              onPress={removeSet}
            />
          </Box>
          <Box flex={1}>
            <Button
              testID={sessionIds.skipExercise}
              label={t('actions.skip')}
              variant="onInk"
              size="sm"
              fullWidth
              onPress={() => {
                nextExercise();
                showToast(t('actions.skipped'));
              }}
            />
          </Box>
        </HStack>
      </VStack>

      <Button
        testID={sessionIds.finish}
        label={t('actions.finish')}
        variant="surface"
        size="lg"
        icon="flag"
        fullWidth
        onPress={goSummary}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resume: { paddingVertical: 4, paddingLeft: 10 },
});
