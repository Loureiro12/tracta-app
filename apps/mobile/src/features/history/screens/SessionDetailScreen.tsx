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

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { PrTag } from '../components/PrTag';
import { RouteMap } from '../components/RouteMap';
import { SplitsCard } from '../components/SplitsCard';
import { StatTile } from '../components/StatTile';
import { historyIds as ids } from '../history.testids';
import { useBackToHistory } from '../hooks/useBackToHistory';
import { formatLongDate } from '../lib/dates';
import { clock, kg, km2, thousands, timeOfDay } from '../lib/format';
import { itemId } from '../lib/ids';
import { historyHrefs } from '../lib/routes';
import { dateOf, sessionById } from '../model/history.mock';
import { useHistoryStore } from '../model/history.store';

import type { HistorySession, SessionExercise } from '../model/history.types';
import type { ViewStyle } from 'react-native';

type Props = { id?: string | undefined };

type Stat = { key: string; label: string; value: string };

/** Session detail (/history/session/[id]): strength (sets per exercise) or run (map + splits). */
export function SessionDetailScreen({ id }: Props) {
  const { t } = useTranslation('history');
  const router = useRouter();
  const theme = useTheme();
  const goBack = useBackToHistory();
  const showToast = useFeedbackStore((s) => s.showToast);
  const deleted = useHistoryStore((s) => s.deletedSessionIds);
  const deleteSession = useHistoryStore((s) => s.deleteSession);
  const notes = useHistoryStore((s) => s.notes);
  const setNote = useHistoryStore((s) => s.setNote);
  const [armed, setArmed] = useState(false);

  const session = useMemo<HistorySession | null>(() => {
    const found = sessionById(id);
    return found && !deleted.includes(found.id) ? found : null;
  }, [id, deleted]);

  const exerciseRowStyle = useMemo<ViewStyle>(
    () => ({
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.divider,
      gap: theme.spacing.xxs,
    }),
    [theme],
  );

  const header = (
    <BackHeader
      testID={ids.sessionBack}
      label={t('detail.back')}
      onPress={goBack}
      trailing={
        session ? (
          <IconButton
            testID={ids.sessionShare}
            icon="share"
            label={t('detail.share')}
            onPress={() =>
              router.push(historyHrefs.share(session.kind === 'run' ? 'run' : 'workout'))
            }
          />
        ) : undefined
      }
    />
  );

  if (!session) {
    return (
      <Screen testID={ids.sessionScreen} header={header}>
        <Text testID={ids.sessionMissing} variant="body" color="text2">
          {t('detail.missing')}
        </Text>
      </Screen>
    );
  }

  const confirmDelete = () => {
    deleteSession(session.id);
    showToast(t('detail.deletedToast'));
    goBack();
  };

  const isRun = session.kind === 'run';
  const title = isRun ? t('detail.runTitle') : session.routine.focus;
  const sub = isRun
    ? t('detail.runSubGps')
    : t('detail.strengthSub', {
        routine: session.routine.name,
        start: timeOfDay(session.startMinutes),
        end: timeOfDay(session.startMinutes + session.durationMinutes),
      });
  const stats: Stat[] = isRun
    ? [
        {
          key: 'distance',
          label: t('detail.stat.distance'),
          value: `${km2(session.distanceKm)} km`,
        },
        { key: 'duration', label: t('detail.stat.duration'), value: clock(session.seconds) },
        { key: 'pace', label: t('detail.stat.pace'), value: `${clock(session.paceSeconds)} /km` },
        { key: 'hr', label: t('detail.stat.hr'), value: `${session.heartRate} bpm` },
      ]
    : [
        {
          key: 'duration',
          label: t('detail.stat.duration'),
          value: t('detail.minutes', { minutes: session.durationMinutes }),
        },
        { key: 'sets', label: t('detail.stat.sets'), value: String(session.totals.sets) },
        { key: 'reps', label: t('detail.stat.reps'), value: String(session.totals.reps) },
        {
          key: 'volume',
          label: t('detail.stat.volume'),
          value: `${thousands(session.totals.volume)} kg`,
        },
      ];

  const setsLine = (e: SessionExercise) =>
    e.sets.length === 0
      ? t('detail.notDone')
      : e.sets
          .map((s) =>
            e.bodyweight || s.kg == null
              ? t('detail.setReps', { reps: s.reps })
              : t('detail.setLoad', { kg: kg(s.kg), reps: s.reps }),
          )
          .join(' · ');

  return (
    <Screen testID={ids.sessionScreen} header={header}>
      <VStack gap="xs">
        <Text testID={ids.sessionDate} variant="secondary" color="text2">
          {formatLongDate(dateOf(session.day))}
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
            {row.map((s) => (
              <StatTile
                key={s.key}
                testID={`${ids.sessionStats}.${s.key}`}
                label={s.label}
                value={s.value}
                size="md"
              />
            ))}
          </HStack>
        ))}
      </VStack>

      {session.kind === 'run' ? (
        <>
          <RouteMap route={session.route} />
          <SplitsCard splits={session.splits} />
        </>
      ) : (
        <Card testID={ids.sessionExercises} px="xl" py="xs" gap="none">
          {session.exercises.map((e) => {
            const rowId = itemId(ids.sessionExercises, e.id);
            return (
              <Box key={e.id} testID={rowId} style={exerciseRowStyle}>
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
      )}

      <VStack gap="sm">
        <Text variant="secondarySemibold">{t('detail.notes')}</Text>
        <TextField
          testID={ids.sessionNotes}
          placeholder={t('detail.notesPlaceholder')}
          value={notes[session.id] ?? ''}
          onChangeText={(text) => setNote(session.id, text)}
          multiline
        />
      </VStack>

      <ListGroup testID={ids.sessionSource}>
        <ListRow
          testID={`${ids.sessionSource}.origin`}
          label={t('detail.source.origin')}
          value={isRun ? t('detail.source.originGps') : t('detail.source.originTracta')}
          valueColor="text2"
        />
        <ListRow
          testID={`${ids.sessionSource}.health`}
          label={t('detail.source.health')}
          value={isRun ? t('detail.source.healthRun') : t('detail.source.healthSummary')}
          valueColor="text2"
        />
        <ListRow
          testID={`${ids.sessionSource}.heart`}
          label={isRun ? t('detail.source.heart') : t('detail.source.hrCalories')}
          value={isRun ? t('detail.source.heartBand') : t('detail.source.unavailable')}
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
