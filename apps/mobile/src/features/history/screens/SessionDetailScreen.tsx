import { useMemo, useState } from 'react';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  IconButton,
  ListGroup,
  ListRow,
  Screen,
  Text,
  TextField,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { RunMap } from '@/features/run';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { useDeleteEntry, useEntryDetail, useUpdateNotes } from '../api/useHistory';
import { PrTag } from '../components/PrTag';
import { QueryState } from '../components/QueryState';
import { SplitsCard } from '../components/SplitsCard';
import { StatTile } from '../components/StatTile';
import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { formatLongDate } from '../lib/dates';
import { splitBars } from '../lib/detail';
import { clock, kg, km2, thousands, timeOfDay } from '../lib/format';
import { itemId } from '../lib/ids';
import { historyHrefs } from '../lib/routes';

import type { sessions } from '@tracta/api';
import type { ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

type Props = { id?: string | undefined };

type Stat = { key: string; label: string; value: string };

const minutesOfDay = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** Session detail (/history/session/[id]): strength (sets per exercise) or activity (map + splits). */
export function SessionDetailScreen({ id }: Props) {
  const { t } = useTranslation('history');
  const router = useRouter();
  const theme = useTheme();
  const goBack = useBackToHistory();
  const showToast = useFeedbackStore((s) => s.showToast);
  const query = useEntryDetail(id);
  const deleteEntry = useDeleteEntry();
  const updateNotes = useUpdateNotes();
  const [armed, setArmed] = useState(false);
  const entry = query.data ?? null;
  const savedNotes =
    entry?.kind === 'strength' ? entry.session.notes : entry ? entry.activity.notes : '';
  // null = untouched: show what the server has.
  const [draftNotes, setNotes] = useState<string | null>(null);
  const notes = draftNotes ?? savedNotes;

  const exerciseRowStyle = useMemo<ViewStyle>(
    () => ({
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      gap: theme.spacing.xxs,
    }),
    [theme],
  );

  const isActivity = entry?.kind === 'activity';
  const header = (
    <BackHeader
      testID={ids.sessionBack}
      label={t('detail.back')}
      onPress={goBack}
      trailing={
        entry ? (
          <IconButton
            testID={ids.sessionShare}
            icon="share"
            label={t('detail.share')}
            onPress={() => router.push(historyHrefs.share(isActivity ? 'run' : 'workout'))}
          />
        ) : undefined
      }
    />
  );

  if (!entry) {
    return (
      <Screen testID={ids.sessionScreen} header={header}>
        {query.isSuccess || !id ? (
          <Text testID={ids.sessionMissing} variant="body" color="text2">
            {t('detail.missing')}
          </Text>
        ) : (
          <QueryState
            testID={ids.sessionScreen}
            error={query.isError}
            onRetry={() => void query.refetch()}
          />
        )}
      </Screen>
    );
  }

  const target = {
    id: entry.kind === 'strength' ? entry.session.id : entry.activity.id,
    kind: entry.kind,
  } as const;
  const confirmDelete = () => {
    if (deleteEntry.isPending) return;
    deleteEntry.mutate(target, {
      onSuccess: () => {
        showToast(t('detail.deletedToast'));
        goBack();
      },
      onError: () => {
        setArmed(false);
        showToast(t('detail.deleteError'));
      },
    });
  };
  const saveNotes = () => {
    if (notes !== savedNotes) updateNotes.mutate({ ...target, notes });
  };

  let date: Date;
  let title: string;
  let sub: string;
  let stats: Stat[];
  let body: ReactNode;
  let gps = false;
  let heart = false;

  if (entry.kind === 'activity') {
    const a = entry.activity;
    const distanceKm = (a.distanceM ?? 0) / 1000;
    gps = a.gps;
    heart = a.avgHeartRate !== null;
    date = new Date(a.startedAt);
    title = a.kind === 'run' ? t('detail.runTitle') : t(`day.activity.${a.kind}`);
    sub = a.gps ? t('detail.runSubGps') : t('detail.runSubManual');
    stats = [
      {
        key: 'distance',
        label: t('detail.stat.distance'),
        value: distanceKm > 0 ? `${km2(distanceKm)} km` : '—',
      },
      { key: 'duration', label: t('detail.stat.duration'), value: clock(a.durationSeconds) },
      {
        key: 'pace',
        label: t('detail.stat.pace'),
        value: distanceKm > 0 ? `${clock(a.durationSeconds / distanceKm)} /km` : '—',
      },
      {
        key: 'hr',
        label: t('detail.stat.hr'),
        value: a.avgHeartRate !== null ? `${a.avgHeartRate} bpm` : '—',
      },
    ];
    body = (
      <>
        {a.route ? (
          <RunMap testID={ids.sessionMap} route={a.route} caption={t('detail.mapLabel')} />
        ) : null}
        {a.splits.length ? <SplitsCard splits={splitBars(a.splits)} /> : null}
      </>
    );
  } else {
    const s = entry.session;
    const minutes = Math.round(s.durationSeconds / 60);
    const start = minutesOfDay(s.startedAt);
    date = new Date(s.startedAt);
    title = s.focus || s.title;
    sub = t('detail.strengthSub', {
      routine: s.title,
      start: timeOfDay(start),
      end: timeOfDay((start + minutes) % (24 * 60)),
    });
    stats = [
      {
        key: 'duration',
        label: t('detail.stat.duration'),
        value: t('detail.minutes', { minutes }),
      },
      { key: 'sets', label: t('detail.stat.sets'), value: String(s.sets) },
      { key: 'reps', label: t('detail.stat.reps'), value: String(s.reps) },
      { key: 'volume', label: t('detail.stat.volume'), value: `${thousands(s.volumeKg)} kg` },
    ];
    const setsLine = (e: sessions.SessionExercise) => {
      const working = e.sets.filter((x) => !x.isWarmup);
      return working.length === 0
        ? t('detail.notDone')
        : working
            .map((x) =>
              e.bodyweight || x.kg == null
                ? t('detail.setReps', { reps: x.reps })
                : t('detail.setLoad', { kg: kg(x.kg), reps: x.reps }),
            )
            .join(' · ');
    };
    body = (
      <Card testID={ids.sessionExercises} px="xl" py="xs" gap="none">
        {s.exercises.map((e) => {
          const rowId = itemId(ids.sessionExercises, e.slug);
          return (
            <Box key={`${e.position}-${e.exerciseId}`} testID={rowId} style={exerciseRowStyle}>
              <HStack gap="sm">
                <Text testID={`${rowId}.name`} variant="bodySemibold">
                  {e.name}
                </Text>
                {e.pr ? <PrTag testID={`${rowId}.pr`} /> : null}
              </HStack>
              <Text testID={`${rowId}.line`} variant="secondary" color="text2" tabular>
                {setsLine(e)}
              </Text>
            </Box>
          );
        })}
      </Card>
    );
  }

  return (
    <Screen testID={ids.sessionScreen} header={header}>
      <VStack gap="xs">
        <Text testID={ids.sessionDate} variant="secondary" color="text2">
          {formatLongDate(date)}
        </Text>
        <Text testID={ids.sessionTitle} variant="overlayTitle">
          {title}
        </Text>
        <Text testID={ids.sessionSub} variant="small" color="text2">
          {sub}
        </Text>
      </VStack>

      <VStack testID={ids.sessionStats} gap="sm">
        {[stats.slice(0, 2), stats.slice(2, 4)].map((row, i) => (
          <HStack key={i} gap="sm" align="stretch">
            {row.map((stat) => (
              <StatTile
                key={stat.key}
                testID={`${ids.sessionStats}.${stat.key}`}
                label={stat.label}
                value={stat.value}
                size="md"
              />
            ))}
          </HStack>
        ))}
      </VStack>

      {body}

      <VStack gap="sm">
        <Text variant="secondarySemibold">{t('detail.notes')}</Text>
        <TextField
          testID={ids.sessionNotes}
          placeholder={t('detail.notesPlaceholder')}
          value={notes}
          onChangeText={setNotes}
          onEndEditing={saveNotes}
          multiline
        />
      </VStack>

      <ListGroup testID={ids.sessionSource}>
        <ListRow
          testID={`${ids.sessionSource}.origin`}
          label={t('detail.source.origin')}
          value={gps ? t('detail.source.originGps') : t('detail.source.originTracta')}
          valueColor="text2"
        />
        <ListRow
          testID={`${ids.sessionSource}.health`}
          label={t('detail.source.health')}
          value={isActivity ? t('detail.source.healthRun') : t('detail.source.healthSummary')}
          valueColor="text2"
        />
        <ListRow
          testID={`${ids.sessionSource}.heart`}
          label={isActivity ? t('detail.source.heart') : t('detail.source.hrCalories')}
          value={heart ? t('detail.source.heartBand') : t('detail.source.unavailable')}
          valueColor="text2"
          last
        />
      </ListGroup>

      <Button
        testID={ids.sessionDelete}
        label={armed ? t('detail.deleteConfirm') : t('detail.delete')}
        variant="dangerText"
        shape="rounded"
        fullWidth
        onPress={armed ? confirmDelete : () => setArmed(true)}
      />
    </Screen>
  );
}
