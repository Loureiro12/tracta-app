import { StyleSheet } from 'react-native';

import { Box, Card, ProgressBar, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { formatShortDate } from '../lib/dates';
import { itemId } from '../lib/ids';

import type { Badge } from '../model/history.mock';
import type { SemanticColors } from '@tracta/design-system';

/** Achievement tile: colored mark, name, description and progress (locked) or the earned date. */
export function BadgeCard({ badge }: { badge: Badge }) {
  const { t } = useTranslation('history');
  const cardId = itemId(ids.achievementsBadges, badge.id);
  const markBg: keyof SemanticColors = badge.earned ? badge.tone : 'fill1';
  const markFg: keyof SemanticColors = badge.earned
    ? badge.tone === 'ink'
      ? 'textOnInk'
      : 'textOnBrand'
    : 'text3';
  return (
    <Card testID={cardId} radius="pill" padding="lg" gap="sm">
      <Box bg={markBg} radius="lg" align="center" justify="center" style={styles.mark}>
        <Text variant="stat" color={markFg}>
          {badge.mark}
        </Text>
      </Box>
      <Text testID={`${cardId}.name`} variant="bodyBold">
        {t(`achievements.badges.${badge.id}.name`)}
      </Text>
      <Text variant="caption" color="text2">
        {t(`achievements.badges.${badge.id}.description`)}
      </Text>
      {badge.earned ? (
        <Text testID={`${cardId}.earned`} variant="captionSemibold" color="brandText">
          {t('achievements.earnedOn', {
            date: formatShortDate(badge.earnedOn),
          })}
        </Text>
      ) : (
        <VStack gap="xs">
          <ProgressBar value={badge.progress} color="ink" height={5} />
          <Text testID={`${cardId}.progress`} variant="captionSemibold" color="text2">
            {t(`achievements.badges.${badge.id}.progress`)}
          </Text>
        </VStack>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  mark: { width: 48, height: 48 },
});
