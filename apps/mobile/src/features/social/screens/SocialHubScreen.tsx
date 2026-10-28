import { useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  HStack,
  ListGroup,
  ListRow,
  Screen,
  Text,
  VStack,
  useTheme,
} from '@tracta/design-system';

import { env } from '@/shared/config/env';
import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import { CheerButton } from '../components/CheerButton';
import { FriendAvatar } from '../components/FriendAvatar';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { emptyStateAvatars, friendById, friends as allFriends } from '../model/social.mock';
import { challengeView } from '../model/social.ranking';
import { socialRoutes } from '../model/social.routes';
import { useSocialStore } from '../model/social.store';
import { socialIds } from '../social.testids';

import type { PrivacyKey } from '../model/social.types';

const PRIVACY_KEYS: PrivacyKey[] = ['done', 'kind', 'streak', 'loads', 'prs'];
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Friends hub: empty state, active challenges, today's activity, invites and social privacy. */
export function SocialHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation('social');
  const showToast = useFeedbackStore((s) => s.showToast);
  const friendIds = useSocialStore((s) => s.friendIds);
  const pendingInvites = useSocialStore((s) => s.pendingInvites);
  const challenges = useSocialStore((s) => s.challenges);
  const cheers = useSocialStore((s) => s.cheers);
  const privacy = useSocialStore((s) => s.privacy);
  const toggleCheer = useSocialStore((s) => s.toggleCheer);
  const startDraft = useSocialStore((s) => s.startDraft);
  const clearFriends = useSocialStore((s) => s.clearFriends);
  const [devUsed, setDevUsed] = useState(false);

  const friends = allFriends.filter((f) => friendIds.includes(f.id));
  const doneCount = friends.filter((f) => f.done).length;
  const sharedCount = PRIVACY_KEYS.filter((k) => privacy[k]).length;

  const onCreate = () => {
    if (friends.length === 0) {
      showToast(t('hub.needFriend'));
      router.push(socialRoutes.invite);
      return;
    }
    startDraft();
    router.push(socialRoutes.newChallenge);
  };

  return (
    <Screen
      testID={socialIds.screen}
      header={
        <BackHeader testID={socialIds.back} label={t('hub.back')} onPress={() => router.back()} />
      }
    >
      <VStack gap="xs">
        <Text testID={socialIds.title} variant="overlayTitle">
          {t('hub.title')}
        </Text>
        <Text color="text2">{t('hub.subtitle')}</Text>
      </VStack>

      {friends.length === 0 ? (
        <Card testID={socialIds.empty} padding="2xl" px="screen" gap="sm">
          <HStack gap="none">
            {emptyStateAvatars.map((a, i) => (
              <Box key={a.name} style={i > 0 ? styles.overlap : undefined}>
                <FriendAvatar name={a.name} color={a.color} size={44} />
              </Box>
            ))}
          </HStack>
          <Text variant="nameTitle">{t('hub.empty.title')}</Text>
          <Text variant="small" color="text2">
            {t('hub.empty.body')}
          </Text>
        </Card>
      ) : null}

      {challenges.length > 0 ? (
        <VStack testID={socialIds.challenges} gap="md" pt="xs">
          <Text variant="secondarySemibold">{t('hub.challenges')}</Text>
          {challenges.map((c) => {
            const view = challengeView(c, friendIds, t('detail.you'), theme.colors.ink);
            return (
              <Card
                key={c.id}
                testID={`${socialIds.challenges}.${c.id}`}
                variant="ink"
                onPress={() => router.push(socialRoutes.challenge(c.id))}
              >
                <HStack justify="space-between" gap="sm">
                  <Text variant="caption" color="text2OnInk" numberOfLines={1}>
                    {view.started
                      ? t('hub.challenge.whenStarted', {
                          days: c.days,
                          end: formatDate(view.endDate, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          }),
                        })
                      : t('hub.challenge.whenTomorrow', { days: c.days })}
                  </Text>
                  <Text variant="caption" color="text2OnInk" numberOfLines={1}>
                    {t('hub.challenge.count', { count: view.participants.length })}
                  </Text>
                </HStack>
                <Text variant="nameTitle" color="textOnInk">
                  {c.name}
                </Text>
                <Text variant="secondary" color="text2OnInk">
                  {t(`detail.rule.${c.type}`, { min: c.min })}
                </Text>
                <Box bg="textOnInk" style={styles.inkHairline} />
                <HStack justify="space-between" gap="sm">
                  <Text variant="smallSemibold" color="textOnInk">
                    {view.started
                      ? t('hub.challenge.me', { pos: view.me.position, count: view.me.points })
                      : t('hub.challenge.meTomorrow')}
                  </Text>
                  <Text variant="secondaryBold" color="brandOnDark">
                    {t('hub.challenge.ranking')}
                  </Text>
                </HStack>
              </Card>
            );
          })}
        </VStack>
      ) : null}

      <Button
        testID={socialIds.create}
        label={t('hub.create')}
        size="lg"
        fullWidth
        onPress={onCreate}
      />

      {friends.length > 0 ? (
        <VStack gap="md" pt="xs">
          <HStack justify="space-between" align="baseline" gap="sm">
            <Text variant="secondarySemibold">{t('hub.today')}</Text>
            <Text testID={socialIds.todayMeta} variant="caption" color="text2">
              {t('hub.todayMeta', { done: doneCount, total: friends.length })}
            </Text>
          </HStack>
          <PeopleCard testID={socialIds.friends}>
            {friends.map((f, i) => {
              const cheered = cheers.includes(f.id);
              const status = f.done
                ? privacy.kind && f.what
                  ? t('hub.friend.statusDone', { what: capitalize(f.what), min: f.min })
                  : t('hub.friend.statusDonePrivate')
                : t('hub.friend.statusTodo');
              return (
                <PersonRow
                  key={f.id}
                  testID={`${socialIds.friends}.${f.id}`}
                  name={f.name}
                  color={f.color}
                  subtitle={status}
                  subtitleColor={f.done ? 'brand' : 'text2'}
                  last={i === friends.length - 1}
                  trailing={
                    f.done ? (
                      <CheerButton
                        testID={`${socialIds.friends}.${f.id}.cheer`}
                        cheered={cheered}
                        label={cheered ? t('hub.friend.cheered') : t('hub.friend.cheer')}
                        onPress={() => toggleCheer(f.id)}
                      />
                    ) : f.streak > 0 ? (
                      <Text variant="caption" color="text3">
                        {t('hub.friend.streak', { count: f.streak })}
                      </Text>
                    ) : null
                  }
                />
              );
            })}
          </PeopleCard>
        </VStack>
      ) : null}

      {pendingInvites.length > 0 ? (
        <VStack gap="md" pt="xs">
          <Text variant="secondarySemibold">{t('hub.pending')}</Text>
          <PeopleCard testID={socialIds.pending}>
            {pendingInvites.map((id, i) => {
              const known = friendById(id);
              return (
                <PersonRow
                  key={id}
                  testID={`${socialIds.pending}.${known ? known.id : id.replace(/^@/, '')}`}
                  name={known ? known.name : id.replace(/^@/, '')}
                  color={known ? known.color : theme.colors.text2}
                  subtitle={known ? t('hub.pendingStatus') : t('hub.pendingStatusSignup')}
                  minHeight={60}
                  last={i === pendingInvites.length - 1}
                />
              );
            })}
          </PeopleCard>
        </VStack>
      ) : null}

      <Button
        testID={socialIds.invite}
        label={t('hub.invite')}
        variant="surface"
        size="lg"
        fullWidth
        onPress={() => router.push(socialRoutes.invite)}
      />

      <ListGroup>
        <ListRow
          testID={socialIds.privacy}
          label={t('hub.privacy')}
          description={t('hub.privacyLine', { count: sharedCount })}
          chevron
          last
          onPress={() => router.push(socialRoutes.privacy)}
        />
      </ListGroup>

      {env.showDevTools && !devUsed ? (
        <ListGroup>
          <ListRow
            testID={socialIds.devNoFriends}
            label={t('hub.dev.noFriends')}
            labelColor="text3"
            last
            onPress={() => {
              clearFriends();
              setDevUsed(true);
            }}
          />
        </ListGroup>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  overlap: { marginLeft: -10 },
  inkHairline: { height: 1, opacity: 0.14, marginTop: 4 },
});
