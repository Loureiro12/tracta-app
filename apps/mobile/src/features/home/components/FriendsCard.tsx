import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Avatar, Box, Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { challengeView, useChallengeBoard, useChallenges, useFriends } from '@/features/social';
import { today } from '@/shared/clock';
import { useTranslation } from '@/shared/i18n';
import { useAccount } from '@/shared/session';

import { CardHeaderRow } from './CardHeaderRow';
import { homeIds } from '../home.testids';

/** Friends / running challenge teaser (top 3 of the first challenge); opens the social hub. */
export function FriendsCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const account = useAccount().data;
  const { data: friendsList } = useFriends();
  const { data: challenges } = useChallenges();
  const first = challenges?.[0];
  const { data: board } = useChallengeBoard(first?.id ?? '');
  const friendCount = friendsList?.length ?? 0;
  const view =
    board && account
      ? challengeView(board, account.profile.id, account.profile.name, '#D8613C', today())
      : null;
  const challenge = view
    ? {
        name: view.challenge.name,
        day: view.dayNumber,
        days: view.challenge.days,
        top: view.rows.slice(0, 3).map((row) => ({
          id: row.participant.id === account?.profile.id ? 'me' : row.participant.id,
          initials: row.participant.name.slice(0, 1),
          name: row.participant.name,
          points: row.points,
        })),
      }
    : null;
  const open = () => router.push('/social');

  const meta = challenge
    ? t('friends.meta.day', { day: challenge.day, days: challenge.days })
    : friendCount > 0
      ? t('friends.meta.friends', { count: friendCount })
      : t('friends.meta.together');

  return (
    <Card testID={homeIds.friendsCard} px="xl" py="lg" onPress={open}>
      <CardHeaderRow
        testID={homeIds.friendsTitle}
        title={challenge ? challenge.name : t('friends.title')}
        dot="challenge"
        meta={meta}
      />
      {challenge ? (
        <VStack testID={homeIds.friendsRanking} gap="sm">
          {challenge.top.map((row, i) => (
            <HStack key={row.id} gap="sm">
              <Box style={styles.position}>
                <Text variant="captionBold" color="text2">
                  {t('friends.position', { position: i + 1 })}
                </Text>
              </Box>
              <Avatar initial={row.initials} size={28} bg="socialBg" color="social" />
              <Box flex={1}>
                <Text variant={row.id === 'me' ? 'smallBold' : 'smallSemibold'} numberOfLines={1}>
                  {row.name}
                </Text>
              </Box>
              <Text variant="smallBold">{t('friends.points', { count: row.points })}</Text>
            </HStack>
          ))}
        </VStack>
      ) : (
        <HStack gap="md" justify="space-between">
          <Box flex={1}>
            <Text variant="small" color="text2">
              {friendCount > 0 ? t('friends.line.create') : t('friends.line.invite')}
            </Text>
          </Box>
          <Button
            testID={homeIds.friendsCta}
            label={friendCount > 0 ? t('friends.cta.create') : t('friends.cta.invite')}
            size="xs"
            onPress={open}
          />
        </HStack>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  position: { width: 16 },
});
