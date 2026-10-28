import { useCallback } from 'react';

import { useRouter } from 'expo-router';

import { Box, Button, HStack, Ring, Screen, Text, VStack } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { useRestCountdown } from '../hooks/useRestCountdown';
import { activeSetIndex, clock } from '../model/session.logic';
import { sessionRoutes } from '../model/session.routes';
import { useSessionStore } from '../model/session.store';
import { sessionIds } from '../session.testids';

/** Rest countdown between sets: ring, −15 s / pause / +15 s, skip and the next-set line. */
export function RestScreen() {
  const router = useRouter();
  const { t } = useTranslation('session');
  const showToast = useFeedbackStore((s) => s.showToast);
  const rest = useSessionStore((s) => s.rest);
  const session = useSessionStore((s) => s.session);
  const restAdjust = useSessionStore((s) => s.restAdjust);
  const restTogglePause = useSessionStore((s) => s.restTogglePause);
  const clearRest = useSessionStore((s) => s.clearRest);

  const leave = useCallback(() => {
    clearRest();
    if (router.canGoBack()) router.back();
    else router.replace(sessionRoutes.session());
  }, [clearRest, router]);

  const onDone = useCallback(() => {
    showToast(t('rest.done'));
    leave();
  }, [showToast, t, leave]);
  useRestCountdown(onDone);

  const exercise = session?.exercises[session.exerciseIndex];
  const nextIdx = exercise ? activeSetIndex(exercise) : -1;
  const nextSet = exercise && nextIdx >= 0 ? exercise.sets[nextIdx] : undefined;
  const nextLine =
    exercise && nextSet
      ? t('rest.next', {
          name: exercise.name,
          num: nextIdx + 1,
          value: exercise.bodyweight
            ? t('set.summaryReps', { reps: nextSet.reps })
            : t('set.summaryKg', {
                kg: formatNumber(nextSet.kg ?? 0, { maximumFractionDigits: 2 }),
                reps: nextSet.reps,
              }),
        })
      : t('rest.end');

  const remaining = rest?.remainingSec ?? 0;
  const total = rest?.totalSec ?? 1;

  return (
    <Screen testID={sessionIds.restScreen} scroll={false}>
      <Box flex={1} align="center" justify="center" gap="2xl" px="sm">
        <Text testID={sessionIds.restLabel} variant="smallBold" color="text2" uppercase>
          {rest?.paused ? t('rest.pausedLabel') : t('rest.label')}
        </Text>
        <Ring
          value={total ? remaining / total : 0}
          size={250}
          strokeWidth={10}
          color="brandText"
          track="fill1"
        >
          <VStack gap="xxs" align="center">
            <Text testID={sessionIds.restTime} variant="heroLg" tabular>
              {clock(remaining)}
            </Text>
            <Text testID={sessionIds.restTotal} variant="secondary" color="text2">
              {t('rest.of', { total: clock(total) })}
            </Text>
          </VStack>
        </Ring>
        <HStack gap="sm" style={styles.full}>
          <Box flex={1}>
            <Button
              testID={sessionIds.restMinus}
              label={t('rest.minus')}
              variant="onInk"
              size="lg"
              fullWidth
              onPress={() => restAdjust(-15)}
            />
          </Box>
          <Box flex={1}>
            <Button
              testID={sessionIds.restPause}
              label={rest?.paused ? t('rest.resume') : t('rest.pause')}
              variant="onInk"
              size="lg"
              fullWidth
              onPress={restTogglePause}
            />
          </Box>
          <Box flex={1}>
            <Button
              testID={sessionIds.restPlus}
              label={t('rest.plus')}
              variant="onInk"
              size="lg"
              fullWidth
              onPress={() => restAdjust(15)}
            />
          </Box>
        </HStack>
        <Button
          testID={sessionIds.restSkip}
          label={t('rest.skip')}
          size="xl"
          fullWidth
          onPress={leave}
        />
        <VStack gap="xxs" align="center">
          <Text variant="caption" color="text2">
            {t('rest.nextLabel')}
          </Text>
          <Text testID={sessionIds.restNext} variant="cardTitleSm" align="center">
            {nextLine}
          </Text>
        </VStack>
        <Text variant="micro" color="text3" align="center">
          {t('rest.note')}
        </Text>
      </Box>
    </Screen>
  );
}

const styles = { full: { alignSelf: 'stretch' } as const };
