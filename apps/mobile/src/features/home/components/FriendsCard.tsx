import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Avatar, Box, Button, Card, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { CardHeaderRow } from './CardHeaderRow';
import { homeIds } from '../home.testids';
import { friends } from '../model/home.mock';

/** Friends / running challenge teaser; opens the social hub. */
export function FriendsCard() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const challenge = friends.challenge;
  const open = () => router.push('/social');

  const meta = challenge
    ? t('friends.meta.day', { day: challenge.day, days: challenge.days })
    : friends.count > 0
      ? t('friends.meta.friends', { count: friends.count })
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
              {friends.count > 0 ? t('friends.line.create') : t('friends.line.invite')}
            </Text>
          </Box>
          <Button
            testID={homeIds.friendsCta}
            label={friends.count > 0 ? t('friends.cta.create') : t('friends.cta.invite')}
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
