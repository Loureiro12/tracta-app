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

import { useFeedbackStore } from '@/shared/feedback';
import { Trans, formatDate, useTranslation } from '@/shared/i18n';

import { ChallengeGrid } from '../components/ChallengeGrid';
import { CheerButton } from '../components/CheerButton';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { challengeView, firstName, pointsFor } from '../model/social.ranking';
import { socialRoutes } from '../model/social.routes';
import { useSocialStore } from '../model/social.store';
import { socialIds } from '../social.testids';

import type { GridCell, GridRow } from '../components/ChallengeGrid';
import type { RankRow } from '../model/social.ranking';

type Props = { id: string };

const DAY_FMT = { weekday: 'short', day: 'numeric', month: 'short' } as const;
const SHORT_FMT = { day: 'numeric', month: 'short' } as const;

/** Challenge detail: daily ranking, your status, day grid, activity feed and rules. */
export function ChallengeDetailScreen({ id }: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const challenge = useSocialStore((s) => s.challenges.find((c) => c.id === id));
  const friendIds = useSocialStore((s) => s.friendIds);
  const cheers = useSocialStore((s) => s.cheers);
  const privacy = useSocialStore((s) => s.privacy);
  const toggleCheer = useSocialStore((s) => s.toggleCheer);
  const leaveChallenge = useSocialStore((s) => s.leaveChallenge);
  const [leaveArmed, setLeaveArmed] = useState(false);

  const header = (
    <BackHeader
      testID={socialIds.challengeBack}
      label={t('detail.back')}
      onPress={() => router.back()}
    />
  );

  if (!challenge) {
    return (
      <Screen testID={socialIds.challengeScreen} header={header}>
        <Box />
      </Screen>
    );
  }

  const view = challengeView(challenge, friendIds, t('detail.you'), theme.colors.ink);
  const { started, me } = view;
  const meDone = started && me.points > 0;
  const cols = Math.min(7, challenge.days);
  const rule = t(`detail.rule.${challenge.type}`, { min: challenge.min });

  const rankStatus = (row: RankRow): string => {
    const p = row.participant;
    if (!started) return t('detail.rank.waiting');
    if (p.done && challenge.type === 'day' && p.min < challenge.min)
      return t('detail.rank.below', { min: p.min });
    if (challenge.type === 'steps')
      return row.points > 0 ? t('detail.rank.stepsOk') : t('detail.rank.stepsNo');
    return p.done ? t('detail.rank.done', { min: p.min }) : t('detail.rank.todo');
  };

  const meLine = !started
    ? t('detail.me.tomorrow')
    : me.points > 0
      ? t('detail.me.done')
      : me.participant.done && challenge.type === 'day'
        ? t('detail.me.partial', {
            min: me.participant.min,
            left: challenge.min - me.participant.min,
          })
        : t('detail.me.auto');

  const gridRows: GridRow[] = view.participants.map((p) => ({
    id: p.id,
    name: p.id === 'me' ? p.name : firstName(p.name),
    cells: Array.from({ length: 7 }, (_, i): GridCell => {
      const live = started && i === 0;
      if (live) return pointsFor(challenge, p) > 0 ? 'point' : 'none';
      return i < cols ? 'next' : 'off';
    }),
  }));

  const feed = view.participants.filter((p) => p.id !== 'me' && p.done);

  const onLeave = () => {
    if (!leaveArmed) {
      setLeaveArmed(true);
      return;
    }
    leaveChallenge(challenge.id);
    showToast(t('detail.left'));
    router.back();
  };

  return (
    <Screen testID={socialIds.challengeScreen} header={header}>
      <VStack gap="xs">
        <Text testID={socialIds.challengeEyebrow} variant="captionBold" color="challenge" uppercase>
          {started
            ? t('detail.eyebrowStarted', { days: challenge.days })
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
            subtitleColor={started && row.points > 0 ? 'brand' : 'text2'}
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
        title={cols < challenge.days ? t('detail.grid.week') : t('detail.grid.days')}
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
              const cheered = cheers.includes(p.id);
              const what =
                privacy.kind && p.what
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
                  subtitle={t('detail.feedWhen', { at: p.at ?? '' })}
                  last={i === feed.length - 1}
                  trailing={
                    <CheerButton
                      testID={`${socialIds.feed}.${p.id}.cheer`}
                      cheered={cheered}
                      label={cheered ? t('hub.friend.cheered') : t('hub.friend.cheer')}
                      onPress={() => toggleCheer(p.id)}
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
          {challenge.type === 'minutes' ? t('detail.rules.maxMinutes') : t('detail.rules.max')}
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
