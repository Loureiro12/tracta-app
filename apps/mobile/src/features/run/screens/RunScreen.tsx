import { useCallback, useEffect, useMemo } from 'react';

import { ScrollView, StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Dot,
  HStack,
  IconButton,
  Screen,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatDate } from '@/shared/i18n';

import { IntervalStrip } from '../components/IntervalStrip';
import { RunMap } from '../components/RunMap';
import { RunStat } from '../components/RunStat';
import { SplitRow } from '../components/SplitRow';
import { useLiveRun } from '../hooks/useLiveRun';
import { useRunLabels } from '../hooks/useRunLabels';
import { EM_DASH, clock, kmh as paceToKmh } from '../model/run.logic';
import { modalities, resolveActivity } from '../model/run.mock';
import { useRunStore } from '../model/run.store';
import { runIds } from '../run.testids';

import type { PhaseKind } from '../model/run.types';
import type { SemanticColors } from '@tracta/design-system';
import type { ViewStyle } from 'react-native';

const PHASE_TONE: Record<PhaseKind, keyof SemanticColors> = {
  warmup: 'warnText',
  work: 'danger',
  recovery: 'brandText',
  cooldown: 'run',
};

export type RunScreenProps = {
  /** `?type=` route param: a modality id or `intervals`. Ignored while an activity is running. */
  type?: string | undefined;
};

/** Live GPS activity: hero distance/time, pace stats, splits, route map and pause/finish. */
export function RunScreen({ type }: RunScreenProps) {
  const router = useRouter();
  const theme = useTheme();
  const { t, km, kmh, modality, phase: phaseLabel, splitLabel, splitPace } = useRunLabels();
  const startRun = useRunStore((s) => s.startRun);
  const togglePause = useRunStore((s) => s.togglePause);
  const endRun = useRunStore((s) => s.endRun);
  const setMiniPlayer = useFeedbackStore((s) => s.setMiniPlayer);
  const live = useLiveRun();

  // Deep links (`tracta://run?type=walk`) start the activity straight away; resuming from the
  // mini-player finds the run already in the store and just reopens it.
  useEffect(() => {
    const activity = resolveActivity(type);
    startRun(activity.type, modalities[activity.type].gps, activity.intervals, {
      title: t('tracking.title'),
      body: t('tracking.body'),
    });
    setMiniPlayer(null);
  }, [type, startRun, setMiniPlayer, t]);

  const footerStyle = useMemo<ViewStyle>(
    () => ({ borderTopWidth: 1, borderTopColor: theme.colors.divider }),
    [theme],
  );
  const splitsContent = useMemo<ViewStyle>(
    () => ({
      paddingHorizontal: theme.spacing['2xl'],
      paddingVertical: theme.spacing.md,
      gap: theme.spacing.xxs,
    }),
    [theme],
  );

  const onMinimize = useCallback(() => {
    if (!live) return;
    const label = modality(live.run.type);
    const subtitle =
      live.dist === null
        ? t('mini.subtitleNoGps')
        : live.avgPace
          ? t('mini.subtitle', { km: km(live.dist), pace: clock(live.avgPace) })
          : t('mini.subtitleNoPace', { km: km(live.dist) });
    setMiniPlayer({
      title: t('mini.title', { label, time: clock(live.sec) }),
      subtitle,
      href: '/run',
    });
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [live, modality, t, km, setMiniPlayer, router]);

  const onEnd = useCallback(() => {
    endRun();
    router.push('/run/summary');
  }, [endRun, router]);

  if (!live) {
    return (
      <Screen testID={runIds.screen} scroll={false} padded={false}>
        {null}
      </Screen>
    );
  }

  const { run, sec, dist, avgPace, curPace, splits, phase, paused, route, gpsFix } = live;
  const md = modalities[run.type];
  const gpsText = run.gps
    ? gpsFix
      ? t('live.gpsGood')
      : t('live.gpsSearching')
    : md.gps
      ? t('live.gpsOff')
      : t('live.gpsNotNeeded');
  const gpsColor: keyof SemanticColors = run.gps ? (gpsFix ? 'brand' : 'warnText') : 'text2';
  const stats: { key: string; label: string; value: string }[] = md.speed
    ? [
        { key: 'time', label: t('live.stat.time'), value: clock(sec) },
        {
          key: 'current-speed',
          label: t('live.stat.currentSpeed'),
          value: curPace ? kmh(paceToKmh(curPace)) : EM_DASH,
        },
        {
          key: 'avg-speed',
          label: t('live.stat.avgSpeed'),
          value: avgPace ? kmh(paceToKmh(avgPace)) : EM_DASH,
        },
      ]
    : run.gps
      ? [
          { key: 'time', label: t('live.stat.time'), value: clock(sec) },
          {
            key: 'current-pace',
            label: t('live.stat.currentPace'),
            value: curPace ? clock(curPace) : EM_DASH,
          },
          {
            key: 'avg-pace',
            label: t('live.stat.avgPace'),
            value: avgPace ? clock(avgPace) : EM_DASH,
          },
        ]
      : [
          {
            key: 'start',
            label: t('live.stat.start'),
            value: formatDate(new Date(run.startedAt), { hour: '2-digit', minute: '2-digit' }),
          },
          { key: 'hr', label: t('live.stat.hr'), value: EM_DASH },
          { key: 'calories', label: t('live.stat.calories'), value: EM_DASH },
        ];
  const splitHint = run.gps
    ? t('live.splitHintGps')
    : md.gps
      ? t('live.splitHintNoGps')
      : t('live.splitHintTimeOnly');

  return (
    <Screen
      testID={runIds.screen}
      scroll={false}
      padded={false}
      footer={
        <Box px="2xl" pt="md" pb="3xl" style={footerStyle}>
          {paused ? (
            <HStack gap="sm">
              <Box flex={1}>
                <Button
                  testID={runIds.liveResume}
                  label={t('live.resume')}
                  variant="primary"
                  size="xl"
                  fullWidth
                  onPress={togglePause}
                />
              </Box>
              <Box flex={1}>
                <Button
                  testID={runIds.liveEnd}
                  label={t('live.end')}
                  variant="dangerText"
                  size="xl"
                  fullWidth
                  onPress={onEnd}
                />
              </Box>
            </HStack>
          ) : (
            <Button
              testID={runIds.livePause}
              label={t('live.pause')}
              icon="pause"
              variant="primary"
              size="xl"
              fullWidth
              onPress={togglePause}
            />
          )}
        </Box>
      }
    >
      <Box flex={1}>
        <HStack px="ml" py="xs" gap="none">
          <IconButton
            testID={runIds.liveMinimize}
            icon="chevron-down"
            label={t('live.minimize')}
            variant="surface"
            size={44}
            onPress={onMinimize}
          />
          <VStack flex={1} align="center" gap="xxs">
            <Text testID={runIds.liveLabel} variant="cardTitleSm" numberOfLines={1}>
              {modality(run.type)}
            </Text>
            <HStack gap="xs">
              <Dot color={gpsColor} size={6} pulse={run.gps && gpsFix} />
              <Text
                testID={runIds.liveGps}
                variant="captionSemibold"
                color={gpsColor}
                numberOfLines={1}
              >
                {gpsText}
              </Text>
            </HStack>
          </VStack>
          <Box style={styles.spacer} />
        </HStack>

        <Box px="lg" pt="sm">
          <RunMap
            testID={runIds.liveMap}
            route={route}
            live
            caption={t('live.mapCaption')}
            {...(run.gps
              ? {}
              : {
                  placeholder: {
                    testID: runIds.liveNoGps,
                    title: md.gps ? t('live.noGpsTitle') : modality(run.type),
                    subtitle: md.gps
                      ? t('live.noGpsSubtitle')
                      : t('live.noGpsModality', { description: t(`modalityDesc.${run.type}`) }),
                  },
                })}
          />
        </Box>

        {paused ? (
          <Box mx="lg" mt="sm" px="ml" py="sm" radius="md" bg="warnBg">
            <Text testID={runIds.livePaused} variant="secondarySemibold" color="warnText">
              {t('live.pausedBanner')}
            </Text>
          </Box>
        ) : null}

        {phase ? (
          <Box mx="lg" mt="sm">
            <IntervalStrip
              testID={runIds.liveInterval}
              label={phase.done ? t('interval.done') : phaseLabel(phase.phase)}
              remaining={phase.done ? EM_DASH : clock(phase.remainingSec)}
              progress={phase.progress}
              tone={phase.done ? 'ink' : PHASE_TONE[phase.phase.kind]}
              next={
                phase.done
                  ? t('interval.doneHint')
                  : phase.next
                    ? t('interval.next', {
                        label: phaseLabel(phase.next),
                        time: clock(phase.next.sec),
                      })
                    : t('interval.last')
              }
            />
          </Box>
        ) : null}

        <VStack px="2xl" pt="lg" gap="ml">
          <VStack gap="none">
            <Text variant="caption" color="text2">
              {run.gps ? t('live.distance') : t('live.time')}
            </Text>
            <Text testID={runIds.liveBig} variant="heroXl" tabular numberOfLines={1}>
              {run.gps ? (dist === null ? EM_DASH : km(dist)) : clock(sec)}
              {run.gps ? (
                <Text variant="nameTitle" color="text2">
                  {` ${t('live.km')}`}
                </Text>
              ) : null}
            </Text>
          </VStack>
          <HStack testID={runIds.liveStats} gap="sm" align="flex-start">
            {stats.map((s) => (
              <RunStat
                key={s.key}
                testID={`${runIds.liveStats}.${s.key}`}
                label={s.label}
                value={s.value}
              />
            ))}
          </HStack>
          <Text variant="caption" color="text2">
            {t('live.hrUnavailable')}
          </Text>
        </VStack>

        <ScrollView
          testID={runIds.liveSplits}
          style={styles.flex}
          contentContainerStyle={splitsContent}
          showsVerticalScrollIndicator={false}
        >
          {splits.length === 0 ? (
            <Text testID={runIds.liveSplitHint} variant="secondary" color="text3">
              {splitHint}
            </Text>
          ) : null}
          {splits.map((s) => (
            <SplitRow
              key={s.km ?? 'partial'}
              testID={`${runIds.liveSplits}.${s.km ?? 'partial'}`}
              label={splitLabel(s)}
              pace={splitPace(s)}
              width={s.width}
              fastest={s.fastest}
            />
          ))}
        </ScrollView>
      </Box>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { width: 44 },
});
