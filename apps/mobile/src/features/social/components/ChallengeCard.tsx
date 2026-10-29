import { StyleSheet } from 'react-native';

import { Box, Card, HStack, Text, useTheme } from '@tracta/design-system';

import { today } from '@/shared/clock';
import { formatDate, useTranslation } from '@/shared/i18n';
import { useSession } from '@/shared/session';

import { useChallengeBoard } from '../api/useChallenges';
import { addDays, challengeView, fromDateKey } from '../model/social.ranking';

import type { social } from '@tracta/api';

type Props = {
  challenge: social.Challenge;
  onPress: () => void;
  testID: string;
};

/** Ink teaser of a challenge on the hub: period, members, rule and the user's position. */
export function ChallengeCard({ challenge, onPress, testID }: Props) {
  const theme = useTheme();
  const { t } = useTranslation('social');
  const { user } = useSession();
  const board = useChallengeBoard(challenge.id);
  const todayKey = today();
  const view = board.data
    ? challengeView(board.data, user?.id ?? '', t('detail.you'), theme.colors.ink, todayKey)
    : null;
  const started = todayKey >= challenge.startsOn;
  const endDate = addDays(fromDateKey(challenge.startsOn), challenge.days - 1);

  return (
    <Card testID={testID} variant="ink" onPress={onPress}>
      <HStack justify="space-between" gap="sm">
        <Text variant="caption" color="text2OnInk" numberOfLines={1}>
          {started
            ? t('hub.challenge.whenStarted', {
                day: view?.dayNumber ?? 1,
                days: challenge.days,
                end: formatDate(endDate, { weekday: 'short', day: 'numeric', month: 'short' }),
              })
            : t('hub.challenge.whenTomorrow', { days: challenge.days })}
        </Text>
        <Text variant="caption" color="text2OnInk" numberOfLines={1}>
          {t('hub.challenge.count', { count: challenge.memberCount })}
        </Text>
      </HStack>
      <Text variant="nameTitle" color="textOnInk">
        {challenge.name}
      </Text>
      <Text variant="secondary" color="text2OnInk">
        {t(`detail.rule.${challenge.kind}`, { min: challenge.minValue })}
      </Text>
      <Box bg="textOnInk" style={styles.inkHairline} />
      <HStack justify="space-between" gap="sm">
        <Text variant="smallSemibold" color="textOnInk">
          {!started
            ? t('hub.challenge.meTomorrow')
            : view
              ? t('hub.challenge.me', { pos: view.me.position, count: view.me.points })
              : ' '}
        </Text>
        <Text variant="secondaryBold" color="brandOnDark">
          {t('hub.challenge.ranking')}
        </Text>
      </HStack>
    </Card>
  );
}

const styles = StyleSheet.create({
  inkHairline: { height: 1, opacity: 0.14, marginTop: 4 },
});
