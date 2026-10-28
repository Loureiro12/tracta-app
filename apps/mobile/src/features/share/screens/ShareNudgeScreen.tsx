import { useCallback, useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import { Box, Pressable } from '@tracta/design-system';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { ShareNudge } from '../components/ShareNudge';
import { NUDGE_TIMEOUT_MS } from '../model/share-nudge.store';
import { isShareTemplate, runMock, todayMock } from '../model/share.mock';
import { shareIds } from '../share.testids';

import type { ShareTemplate } from '../model/share.mock';

export type ShareNudgeScreenProps = {
  /** Card to open from "Criar cartão": `today` (default) or `run`. */
  template?: string | undefined;
};

const nudgeTestIDs = {
  card: shareIds.nudgeCard,
  title: shareIds.nudgeTitle,
  description: shareIds.nudgeDescription,
  create: shareIds.nudgeCreate,
  dismiss: shareIds.nudgeDismiss,
};

/**
 * Transparent route (`/share/nudge?template=today|run`) hosting the post-save nudge above the
 * current screen. Dismisses itself after 7 s, on the × button or on a backdrop tap.
 */
export function ShareNudgeScreen({ template }: ShareNudgeScreenProps) {
  const router = useRouter();
  const { t } = useTranslation('share');
  const target: ShareTemplate = isShareTemplate(template) ? template : 'today';

  const title =
    target === 'run'
      ? t('nudge.run.title', { km: formatNumber(runMock.km, { maximumFractionDigits: 1 }) })
      : t('nudge.today.title', { count: todayMock.sets });
  const description =
    target === 'run'
      ? t('nudge.run.description')
      : todayMock.prs > 0
        ? t('nudge.today.descriptionPr')
        : t('nudge.today.descriptionNoPr');

  const dismiss = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  const create = useCallback(() => {
    router.replace({ pathname: '/share', params: { template: target } });
  }, [router, target]);

  useEffect(() => {
    const timer = setTimeout(dismiss, NUDGE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [dismiss]);

  return (
    <Box testID={shareIds.nudgeScreen} flex={1}>
      <Pressable
        testID={shareIds.nudgeBackdrop}
        onPress={dismiss}
        accessibilityLabel={t('nudge.dismiss')}
        pressedOpacity={1}
        style={StyleSheet.absoluteFill}
      />
      <Box style={styles.slot} pointerEvents="box-none">
        <ShareNudge
          title={title}
          description={description}
          createLabel={t('nudge.create')}
          dismissLabel={t('nudge.dismiss')}
          onCreate={create}
          onDismiss={dismiss}
          testIDs={nudgeTestIDs}
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: 12, right: 12, bottom: 100 },
});
