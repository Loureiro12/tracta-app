import { useEffect, useState } from 'react';

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
import { useTranslation } from '@/shared/i18n';

import { useChallenges } from '../api/useChallenges';
import { useCheers, useToggleCheer } from '../api/useCheers';
import { useEmailInvites, useRevokeEmailInvite } from '../api/useEmailInvites';
import { useFriendRequests, useRespondRequest } from '../api/useFriendRequests';
import { useFriends } from '../api/useFriends';
import { usePrivacy } from '../api/usePrivacy';
import { ChallengeCard } from '../components/ChallengeCard';
import { CheerButton } from '../components/CheerButton';
import { FriendAvatar } from '../components/FriendAvatar';
import { LoadError } from '../components/LoadError';
import { PeopleCard } from '../components/PeopleCard';
import { PersonRow } from '../components/PersonRow';
import { avatarColor, emptyStateAvatars } from '../model/social.constants';
import { firstName } from '../model/social.ranking';
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
  const friendsQuery = useFriends();
  const requestsQuery = useFriendRequests();
  const challengesQuery = useChallenges();
  const cheersQuery = useCheers();
  const toggleCheer = useToggleCheer();
  const respond = useRespondRequest();
  const privacy = usePrivacy();
  const emailInvitesQuery = useEmailInvites();
  const revokeInvite = useRevokeEmailInvite();
  const simulateNoFriends = useSocialStore((s) => s.simulateNoFriends);
  const setSimulateNoFriends = useSocialStore((s) => s.setSimulateNoFriends);
  const startDraft = useSocialStore((s) => s.startDraft);
  const [devUsed, setDevUsed] = useState(false);

  // The dev "no friends" simulation lasts while the hub is open.
  useEffect(() => () => setSimulateNoFriends(false), [setSimulateNoFriends]);

  const friends = simulateNoFriends ? [] : (friendsQuery.data ?? []);
  const challenges = simulateNoFriends ? [] : (challengesQuery.data ?? []);
  const incoming = simulateNoFriends ? [] : (requestsQuery.data?.incoming ?? []);
  const outgoing = simulateNoFriends ? [] : (requestsQuery.data?.outgoing ?? []);
  const emailInvites = simulateNoFriends ? [] : (emailInvitesQuery.data ?? []);
  const cheers = cheersQuery.data ?? [];
  const doneCount = friends.filter((f) => f.done).length;
  const sharedCount = PRIVACY_KEYS.filter((k) => privacy[k]).length;
  const loading = friendsQuery.isPending || challengesQuery.isPending;
  const failed = friendsQuery.isError || challengesQuery.isError || requestsQuery.isError;
  const pendingCount = outgoing.length + emailInvites.length;

  const retry = () => {
    void friendsQuery.refetch();
    void challengesQuery.refetch();
    void requestsQuery.refetch();
  };

  const onCreate = () => {
    if (friends.length === 0) {
      showToast(t('hub.needFriend'));
      router.push(socialRoutes.invite);
      return;
    }
    startDraft(friends.map((f) => f.userId));
    router.push(socialRoutes.newChallenge);
  };

  const onRespond = (requestId: string, name: string, accept: boolean) =>
    respond.mutate(
      { requestId, accept },
      {
        onSuccess: () =>
          showToast(accept ? t('hub.accepted', { name: firstName(name) }) : t('hub.declined')),
        onError: () => showToast(t('actionError')),
      },
    );

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

      {failed ? <LoadError testID={socialIds.screen} onRetry={retry} /> : null}

      {!loading && !failed && friends.length === 0 ? (
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
          {challenges.map((c) => (
            <ChallengeCard
              key={c.id}
              testID={`${socialIds.challenges}.${c.id}`}
              challenge={c}
              onPress={() => router.push(socialRoutes.challenge(c.id))}
            />
          ))}
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
              const cheered = cheers.includes(f.userId);
              const status = f.done
                ? f.what
                  ? t('hub.friend.statusDone', { what: capitalize(f.what), min: f.min })
                  : t('hub.friend.statusDonePrivate')
                : t('hub.friend.statusTodo');
              return (
                <PersonRow
                  key={f.userId}
                  testID={`${socialIds.friends}.${f.key}`}
                  name={f.name}
                  color={f.color}
                  subtitle={status}
                  subtitleColor={f.done ? 'brand' : 'text2'}
                  last={i === friends.length - 1}
                  trailing={
                    f.done ? (
                      <CheerButton
                        testID={`${socialIds.friends}.${f.key}.cheer`}
                        cheered={cheered}
                        label={cheered ? t('hub.friend.cheered') : t('hub.friend.cheer')}
                        onPress={() => toggleCheer.mutate({ friendId: f.userId, cheered })}
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

      {incoming.length > 0 ? (
        <VStack gap="md" pt="xs">
          <Text variant="secondarySemibold">{t('hub.requests')}</Text>
          <PeopleCard testID={socialIds.requests}>
            {incoming.map((r, i) => {
              const key = r.person.handle ?? r.person.id;
              return (
                <PersonRow
                  key={r.id}
                  testID={`${socialIds.requests}.${key}`}
                  name={r.person.name}
                  color={avatarColor(r.person.id)}
                  subtitle={t('hub.requestStatus')}
                  minHeight={62}
                  last={i === incoming.length - 1}
                  trailing={
                    <HStack gap="xs">
                      <Button
                        testID={`${socialIds.requests}.${key}.decline`}
                        label={t('hub.decline')}
                        variant="secondary"
                        size="xs"
                        onPress={() => onRespond(r.id, r.person.name, false)}
                      />
                      <Button
                        testID={`${socialIds.requests}.${key}.accept`}
                        label={t('hub.accept')}
                        size="xs"
                        onPress={() => onRespond(r.id, r.person.name, true)}
                      />
                    </HStack>
                  }
                />
              );
            })}
          </PeopleCard>
        </VStack>
      ) : null}

      {pendingCount > 0 ? (
        <VStack gap="md" pt="xs">
          <Text variant="secondarySemibold">{t('hub.pending')}</Text>
          <PeopleCard testID={socialIds.pending}>
            {outgoing.map((r, i) => (
              <PersonRow
                key={r.id}
                testID={`${socialIds.pending}.${r.person.handle ?? r.person.id}`}
                name={r.person.name}
                color={avatarColor(r.person.id)}
                subtitle={t('hub.pendingStatus')}
                minHeight={60}
                last={i === pendingCount - 1}
              />
            ))}
            {emailInvites.map((invite, i) => (
              <PersonRow
                key={invite.id}
                testID={`${socialIds.pending}.${invite.email}`}
                name={invite.email}
                color={theme.colors.text2}
                subtitle={t('hub.pendingStatusSignup')}
                minHeight={60}
                last={outgoing.length + i === pendingCount - 1}
                trailing={
                  <Button
                    testID={`${socialIds.pending}.${invite.email}.revoke`}
                    label={t('hub.revoke')}
                    variant="secondary"
                    size="xs"
                    onPress={() =>
                      revokeInvite.mutate(invite.id, {
                        onSuccess: () => showToast(t('hub.revoked')),
                        onError: () => showToast(t('actionError')),
                      })
                    }
                  />
                }
              />
            ))}
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
              setSimulateNoFriends(true);
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
});
