import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  Screen,
  Stepper,
  Text,
  TextField,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatNumber, useTranslation } from '@/shared/i18n';

import { RouteMap } from '../components/RouteMap';
import { RunStat } from '../components/RunStat';
import { SplitRow } from '../components/SplitRow';
import { useRunLabels } from '../hooks/useRunLabels';
import { EM_DASH, clock, kmh as paceToKmh, splitsFor } from '../model/run.logic';
import { POOL_LENGTH_M, modalities } from '../model/run.mock';
import { useRunStore } from '../model/run.store';
import { runIds } from '../run.testids';

import type { ViewStyle } from 'react-native';

type Stat = { key: string; label: string; value: string };

/** Post-activity review: stats, map, splits (or pool log), notes, destinations and save/discard. */
export function RunSummaryScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t: tc } = useTranslation('common');
  const { t, km, kmh, modality, splitLabel, splitPace } = useRunLabels();
  const summary = useRunStore((s) => s.summary);
  const notes = useRunStore((s) => s.notes);
  const saving = useRunStore((s) => s.saving);
  const setNotes = useRunStore((s) => s.setNotes);
  const adjustSwim = useRunStore((s) => s.adjustSwim);
  const setSaving = useRunStore((s) => s.setSaving);
  const backToRun = useRunStore((s) => s.backToRun);
  const reset = useRunStore((s) => s.reset);
  const showToast = useFeedbackStore((s) => s.showToast);
  const setMiniPlayer = useFeedbackStore((s) => s.setMiniPlayer);
  const [armed, setArmed] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const footerStyle = useMemo<ViewStyle>(
    () => ({ borderTopWidth: 1, borderTopColor: theme.colors.dividerStrong }),
    [theme],
  );

  const finish = useCallback(
    (message: string) => {
      reset();
      setMiniPlayer(null);
      showToast(message);
      router.replace('/');
    },
    [reset, setMiniPlayer, showToast, router],
  );

  const onSave = useCallback(() => {
    if (saving !== 0) return;
    setSaving(1);
    timers.current.push(setTimeout(() => setSaving(2), 900));
    timers.current.push(setTimeout(() => finish(t('summary.toastSaved')), 2000));
  }, [saving, setSaving, finish, t]);

  const onDiscard = useCallback(() => {
    if (!armed) {
      setArmed(true);
      return;
    }
    finish(t('summary.toastDiscarded'));
  }, [armed, finish, t]);

  const onBack = useCallback(() => {
    backToRun();
    router.back();
  }, [backToRun, router]);

  const stats = useMemo<Stat[]>(() => {
    if (!summary) return [];
    const md = modalities[summary.type];
    const duration = {
      key: 'duration',
      label: t('summary.stat.duration'),
      value: clock(summary.sec),
    };
    const hr = { key: 'avg-hr', label: t('summary.stat.avgHr'), value: EM_DASH };
    if (md.swim) {
      const meters = summary.swimMeters ?? 0;
      return [
        duration,
        {
          key: 'distance',
          label: t('summary.stat.distance'),
          value: t('summary.meters', { value: formatNumber(meters) }),
        },
        {
          key: 'pace-100',
          label: t('summary.stat.pace100'),
          value: clock(summary.sec / Math.max(meters / 100, 0.01)),
        },
        hr,
      ];
    }
    if (summary.distKm === null) {
      return [
        duration,
        { key: 'modality', label: t('summary.stat.modality'), value: modality(summary.type) },
        hr,
        { key: 'calories', label: t('summary.stat.calories'), value: EM_DASH },
      ];
    }
    const pace = summary.sec / Math.max(summary.distKm, 0.01);
    return [
      {
        key: 'distance',
        label: t('summary.stat.distance'),
        value: t('summary.km', { value: km(summary.distKm) }),
      },
      duration,
      md.speed
        ? { key: 'avg-speed', label: t('summary.stat.avgSpeed'), value: kmh(paceToKmh(pace)) }
        : {
            key: 'avg-pace',
            label: t('summary.stat.avgPace'),
            value: t('split.pace', { pace: clock(pace) }),
          },
      hr,
    ];
  }, [summary, t, km, kmh, modality]);

  const splits = useMemo(
    () => (summary ? splitsFor(summary.type, summary.distKm, summary.sec) : []),
    [summary],
  );

  if (!summary) {
    return <Screen testID={runIds.summaryScreen}>{null}</Screen>;
  }

  const md = modalities[summary.type];
  const discardLabel = armed ? tc('actions.confirmAgain') : t('summary.discard');
  const swimMeters = summary.swimMeters ?? 0;
  const rows: Stat[][] = [];
  for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2));

  return (
    <Screen
      testID={runIds.summaryScreen}
      footer={
        <Box px="screen" pt="ml" pb="3xl" bg="bg" style={footerStyle}>
          <Button
            testID={runIds.summarySave}
            label={
              saving === 2
                ? t('summary.savedCta')
                : saving === 1
                  ? t('summary.saving')
                  : t('summary.save')
            }
            variant={saving === 2 ? 'brand' : 'primary'}
            size="xl"
            fullWidth
            elevated
            onPress={onSave}
          />
        </Box>
      }
    >
      <Text variant="secondary" color="text2">
        {t('summary.eyebrow')}
      </Text>
      <Text testID={runIds.summaryTitle} variant="overlayTitle">
        {modality(summary.type)}
      </Text>

      <VStack testID={runIds.summaryStats} gap="sm">
        {rows.map((row, i) => (
          <HStack key={i} gap="sm" align="stretch">
            {row.map((s) => (
              <Box key={s.key} flex={1}>
                <Card padding="ml" radius="xl" gap="xxs">
                  <RunStat
                    testID={`${runIds.summaryStats}.${s.key}`}
                    label={s.label}
                    value={s.value}
                  />
                </Card>
              </Box>
            ))}
          </HStack>
        ))}
      </VStack>

      {summary.gps ? (
        <RouteMap testID={runIds.summaryMap} fraction={1} caption={t('live.mapCaption')} />
      ) : null}

      {splits.length > 0 ? (
        <Card testID={runIds.summarySplits} padding="lg" px="xl" gap="xs">
          <Text variant="bodySemibold">{t('summary.splits')}</Text>
          {splits.map((s) => (
            <SplitRow
              key={s.km ?? 'partial'}
              testID={`${runIds.summarySplits}.${s.km ?? 'partial'}`}
              label={splitLabel(s)}
              pace={splitPace(s)}
              width={s.width}
              fastest={s.fastest}
            />
          ))}
        </Card>
      ) : null}

      {md.swim ? (
        <VStack gap="sm">
          <Text testID={runIds.summarySwimLabel} variant="secondarySemibold">
            {t('summary.swimLabel')}
          </Text>
          <HStack gap="sm" align="stretch">
            <Box flex={1}>
              <Card padding="sm" radius="md" gap="xxs">
                <Text variant="micro" color="text2" align="center">
                  {t('summary.swimDistance')}
                </Text>
                <Stepper
                  testID={runIds.summarySwim}
                  valueLabel={t('summary.meters', { value: formatNumber(swimMeters) })}
                  decrementLabel={t('summary.swimMinus')}
                  incrementLabel={t('summary.swimPlus')}
                  onDecrement={() => adjustSwim(-1)}
                  onIncrement={() => adjustSwim(1)}
                />
              </Card>
            </Box>
            <Box flex={1}>
              <Card padding="sm" radius="md" gap="xxs">
                <Text variant="micro" color="text2" align="center">
                  {t('summary.swimLaps')}
                </Text>
                <Text testID={runIds.summarySwimLaps} variant="stat" align="center" tabular>
                  {String(Math.round(swimMeters / POOL_LENGTH_M))}
                </Text>
              </Card>
            </Box>
          </HStack>
        </VStack>
      ) : null}

      <TextField
        testID={runIds.summaryNotes}
        label={t('summary.notesLabel')}
        placeholder={t('summary.notesPlaceholder')}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Card gap="sm">
        <Text variant="bodySemibold">{t('summary.destination')}</Text>
        <HStack justify="space-between" gap="sm">
          <Text variant="small">{t('summary.destLocal')}</Text>
          <Text
            testID={runIds.summaryLocal}
            variant="smallSemibold"
            color={saving ? 'success' : 'text2'}
          >
            {saving ? t('summary.saved') : t('summary.pending')}
          </Text>
        </HStack>
        <HStack justify="space-between" gap="sm">
          <Text variant="small">{t('summary.destHealth')}</Text>
          <Text
            testID={runIds.summaryHealth}
            variant="smallSemibold"
            color={saving === 2 ? 'success' : 'text2'}
          >
            {saving === 2
              ? t('summary.written')
              : saving === 1
                ? t('summary.writing')
                : t('summary.pending')}
          </Text>
        </HStack>
        <Text variant="caption" color="text2">
          {t('summary.destNote')}
        </Text>
      </Card>

      <HStack gap="sm" align="stretch">
        <Box flex={1}>
          <Button
            testID={runIds.summaryBack}
            label={t('summary.back')}
            variant="secondary"
            size="md"
            fullWidth
            onPress={onBack}
          />
        </Box>
        <Box flex={1}>
          <Button
            testID={runIds.summaryDiscard}
            label={discardLabel}
            variant={armed ? 'danger' : 'dangerText'}
            size="md"
            fullWidth
            onPress={onDiscard}
          />
        </Box>
      </HStack>
    </Screen>
  );
}
