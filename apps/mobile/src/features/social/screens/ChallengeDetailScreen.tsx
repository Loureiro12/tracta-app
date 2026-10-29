import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  Pressable,
  Screen,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { today } from '@/shared/clock';
import { useFeedbackStore } from '@/shared/feedback';
import { Trans, formatDate, useTranslation } from '@/shared/i18n';
import { useSession } from '@/shared/session';

import { useChallengeBoard, useLeaveChallenge } from '../api/useChallenges';
import { useCheers, useToggleCheer } from '../api/useCheers';
import { ChallengeGrid } from '../components/ChallengeGrid';
import { CheerButton } from '../components/CheerButton';
import { LoadError } from '../components/LoadError';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { challengeView, firstName } from '../model/social.ranking';
import { socialRoutes } from '../model/social.routes';
import { socialIds } from '../social.testids';

import type { GridRow } from '../components/ChallengeGrid';
import type { RankRow } from '../model/social.ranking';

type Props = { id: string };

const DAY_FMT = { weekday: 'short', day: 'numeric', month: 'short' } as const;
const SHORT_FMT = { day: 'numeric', month: 'short' } as const;
const TIME_FMT = { hour: '2-digit', minute: '2-digit' } as const;

/** Challenge detail: daily ranking, your status, day grid, activity feed and rules. */
export function ChallengeDetailScreen({ id }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const { user } = useSession();
  const board = useChallengeBoard(id);
  const cheers = useCheers().data ?? [];
  const toggleCheer = useToggleCheer();
  const leave = useLeaveChallenge();
  const [leaveArmed, setLeaveArmed] = useState(false);

  const header = (
    <BackHeader
      testID={socialIds.challengeBack}
      label={t('detail.back')}
      onPress={() => router.back()}
    />
  );

  if (!board.data) {
    return (
      <Screen testID={socialIds.challengeScreen} header={header}>
        {board.isError && !leave.isSuccess ? (
          <LoadError testID={socialIds.challengeScreen} onRetry={() => void board.refetch()} />
        ) : (
          <Box />
        )}
      </Screen>
    );
  }

  const todayKey = today();
  const view = challengeView(
    board.data,
    user?.id ?? '',
    t('detail.you'),
    theme.colors.ink,
    todayKey,
  );
  const { challenge, started, me } = view;
  const meToday = view.todayPoints.me ?? 0;
  const meDone = started && meToday > 0;
  const rule = t(`detail.rule.${challenge.kind}`, { min: challenge.minValue });

  const rankStatus = (row: RankRow): string => {
    const p = row.participant;
    if (!started) return t('detail.rank.waiting');
    if (p.done && challenge.kind === 'day' && p.min < challenge.minValue)
      return t('detail.rank.below', { min: p.min });
    if (challenge.kind === 'steps')
      return (view.todayPoints[p.id] ?? 0) > 0
        ? t('detail.rank.stepsOk')
        : t('detail.rank.stepsNo');
    return p.done ? t('detail.rank.done', { min: p.min }) : t('detail.rank.todo');
  };

  const meLine = !started
    ? t('detail.me.tomorrow')
    : meToday > 0
      ? t('detail.me.done')
      : me.participant.done && challenge.kind === 'day'
        ? t('detail.me.partial', {
            min: me.participant.min,
            left: challenge.minValue - me.participant.min,
          })
        : t('detail.me.auto');

  const gridRows: GridRow[] = view.participants.map((p) => ({
    id: p.id,
    name: p.id === 'me' ? p.name : firstName(p.name),
    cells: view.cells[p.id] ?? [],
  }));

  const feed = view.participants.filter((p) => p.id !== 'me' && p.done);

  const onLeave = () => {
    if (!leaveArmed) {
      setLeaveArmed(true);
      return;
    }
    leave.mutate(challenge.id, { onError: () => showToast(t('actionError')) });
    showToast(t('detail.left'));
    router.back();
  };

  return (
    <Screen testID={socialIds.challengeScreen} header={header}>
      <VStack gap="xs">
        <Text testID={socialIds.challengeEyebrow} variant="captionBold" color="challenge" uppercase>
          {started
            ? t('detail.eyebrowStarted', { day: view.dayNumber, days: challenge.days })
            : t('detail.eyebrowTomorrow')}
        </Text>
        <Text testID={socialIds.challengeTitle} variant="heroMd">
          {challenge.name}
        </Text>
        <Text variant="small" color="text2">
          {rule}
        </Text>
      </VStack>

      <Box testID={socialIds.ranking} bg="surface" radius="card" px="lg" py="xs">
        {view.rows.map((row, i) => (
          <PersonRow
            key={row.participant.id}
            testID={`${socialIds.ranking}.${row.participant.id}`}
            name={row.participant.name}
            color={row.participant.color}
            titleVariant={row.participant.id === 'me' ? 'bodyBold' : 'bodySemibold'}
            subtitle={rankStatus(row)}
            subtitleColor={
              started && (view.todayPoints[row.participant.id] ?? 0) > 0 ? 'brand' : 'text2'
            }
            minHeight={64}
            last={i === view.rows.length - 1}
            leading={
              <Box style={styles.position}>
                <Text
                  variant="secondaryBold"
                  color={row.position === 1 && row.points > 0 ? 'challenge' : 'text3'}
                >
                  {row.position}
                </Text>
              </Box>
            }
            trailing={
              <VStack gap="none" align="flex-end">
                <Text variant="nameTitle" tabular>
                  {row.points}
                </Text>
                <Text variant="micro" color="text2">
                  {t('detail.rank.points', { count: row.points })}
                </Text>
              </VStack>
            }
          />
        ))}
      </Box>

      {meDone ? (
        <Box bg="brandTint" radius="lg" px="lg" py="ml">
          <Text testID={socialIds.meLine} variant="smallSemibold" color="brandText">
            {meLine}
          </Text>
        </Box>
      ) : (
        <Card>
          <Text testID={socialIds.meLine}>{meLine}</Text>
          <Button
            testID={socialIds.train}
            label={t('detail.me.train')}
            size="lg"
            fullWidth
            onPress={() => router.navigate(socialRoutes.workouts)}
          />
        </Card>
      )}

      <ChallengeGrid
        testID={socialIds.grid}
        title={
          challenge.days > 7 ? t('detail.grid.week', { n: view.week + 1 }) : t('detail.grid.days')
        }
        meta={
          started
            ? t('detail.grid.ends', { end: formatDate(view.endDate, DAY_FMT) })
            : t('detail.grid.range', {
                start: formatDate(view.startDate, SHORT_FMT),
                end: formatDate(view.endDate, DAY_FMT),
              })
        }
        rows={gridRows}
        legend={{
          point: t('detail.grid.legendPoint'),
          none: t('detail.grid.legendNone'),
          next: t('detail.grid.legendNext'),
        }}
      />

      {started && feed.length > 0 ? (
        <VStack gap="md" pt="xs">
          <Text variant="secondarySemibold">{t('detail.activity')}</Text>
          <PeopleCard testID={socialIds.feed}>
            {feed.map((p, i) => {
              const cheered = cheers.includes(p.userId);
              const what = p.what
                ? t('detail.feedWhat', { what: p.what, min: p.min })
                : t('detail.feedWhatPrivate');
              return (
                <PersonRow
                  key={p.id}
                  testID={`${socialIds.feed}.${p.id}`}
                  name={p.name}
                  color={p.color}
                  title={
                    <Text variant="small">
                      <Trans
                        t={t}
                        i18nKey="detail.feedLine"
                        values={{ first: firstName(p.name), what }}
                        components={{ b: <Text variant="smallBold" /> }}
                      />
                    </Text>
                  }
                  subtitle={
                    p.at
                      ? t('detail.feedWhen', { at: formatDate(new Date(p.at), TIME_FMT) })
                      : t('detail.feedWhenToday')
                  }
                  last={i === feed.length - 1}
                  trailing={
                    <CheerButton
                      testID={`${socialIds.feed}.${p.id}.cheer`}
                      cheered={cheered}
                      label={cheered ? t('hub.friend.cheered') : t('hub.friend.cheer')}
                      onPress={() => toggleCheer.mutate({ friendId: p.userId, cheered })}
                    />
                  }
                />
              );
            })}
          </PeopleCard>
        </VStack>
      ) : null}

      <Card gap="xs">
        <Text variant="bodySemibold">{t('detail.rules.title')}</Text>
        <Text variant="secondary" color="text2">
          {t('detail.rules.first', { rule })}
        </Text>
        <Text variant="secondary" color="text2">
          {t('detail.rules.any')}
        </Text>
        <Text variant="secondary" color="text2">
          {challenge.kind === 'minutes' ? t('detail.rules.maxMinutes') : t('detail.rules.max')}
        </Text>
        <Text variant="secondary" color="text2">
          {t('detail.rules.ties')}
        </Text>
      </Card>

      <Button
        testID={socialIds.challengeInvite}
        label={t('detail.inviteMore')}
        variant="surface"
        size="lg"
        fullWidth
        onPress={() => router.push(socialRoutes.invite)}
      />

      <Pressable testID={socialIds.leave} onPress={onLeave} style={styles.leave}>
        <Text testID={`${socialIds.leave}.label`} variant="smallBold" color="danger">
          {leaveArmed ? t('detail.leaveConfirm') : t('detail.leave')}
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  position: { width: 22 },
  leave: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
