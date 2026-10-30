import { StyleSheet } from 'react-native';

import { Box, Card, ProgressBar, Text, VStack } from '@tracta/design-system';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { BADGE_STYLE } from '../lib/badges';
import { formatShortDate } from '../lib/dates';
import { clock } from '../lib/format';
import { itemId } from '../lib/ids';
import { parseDateKey } from '../lib/month';

import type { achievements } from '@tracta/api';
import type { SemanticColors } from '@tracta/design-system';

/** Progress line of a locked badge, from the value measured by the server. */
function useProgressLabel(badge: achievements.Badge): string {
  const { t } = useTranslation('history');
  const current = badge.current ?? 0;
  const counts = { current, target: badge.target };
  switch (badge.id) {
    case 'first5k':
      return current > 0
        ? t('achievements.badges.first5k.progress', {
            km: formatNumber(current / 1000, { maximumFractionDigits: 1 }),
          })
        : t('achievements.badges.first5k.progressNone');
    case 'oneTon':
      return current > 0
        ? t('achievements.badges.oneTon.progress', {
            kg: formatNumber(current, { maximumFractionDigits: 0 }),
          })
        : t('achievements.badges.oneTon.progressNone');
    case 'tenKSub55':
      return badge.current !== null
        ? t('achievements.badges.tenKSub55.progress', { time: clock(badge.current) })
        : t('achievements.badges.tenKSub55.progressNone');
    case 'streak12':
      return t('achievements.badges.streak12.progress', counts);
    case 'streak30':
      return t('achievements.badges.streak30.progress', counts);
    case 'workouts50':
      return t('achievements.badges.workouts50.progress', counts);
    case 'workouts100':
      return t('achievements.badges.workouts100.progress', counts);
    case 'perfectMonth':
      return t('achievements.badges.perfectMonth.progress', counts);
  }
}

/** Achievement tile: colored mark, name, description and progress (locked) or the earned date. */
export function BadgeCard({ badge }: { badge: achievements.Badge }) {
  const { t } = useTranslation('history');
  const progressLabel = useProgressLabel(badge);
  const cardId = itemId(ids.achievementsBadges, badge.id);
  const style = BADGE_STYLE[badge.id];
  const earnedOn = parseDateKey(badge.earnedOn ?? undefined);
  const markBg: keyof SemanticColors = earnedOn ? style.tone : 'fill1';
  const markFg: keyof SemanticColors = earnedOn
    ? style.tone === 'ink'
      ? 'textOnInk'
      : 'textOnBrand'
    : 'text3';
  return (
    <Card testID={cardId} radius="pill" padding="lg" gap="sm">
      <Box bg={markBg} radius="lg" align="center" justify="center" style={styles.mark}>
        <Text variant="stat" color={markFg}>
          {style.mark}
        </Text>
      </Box>
      <Text testID={`${cardId}.name`} variant="bodyBold">
        {t(`achievements.badges.${badge.id}.name`)}
      </Text>
      <Text variant="caption" color="text2">
        {t(`achievements.badges.${badge.id}.description`)}
      </Text>
      {earnedOn ? (
        <Text testID={`${cardId}.earned`} variant="captionSemibold" color="brandText">
          {t('achievements.earnedOn', { date: formatShortDate(earnedOn) })}
        </Text>
      ) : (
        <VStack gap="xs">
          <ProgressBar value={badge.progress} color="ink" height={5} />
          <Text testID={`${cardId}.progress`} variant="captionSemibold" color="text2">
            {progressLabel}
          </Text>
        </VStack>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  mark: { width: 48, height: 48 },
});
