import { useLayoutEffect, useState } from 'react';

import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  HStack,
  Heading,
  Pressable,
  Sheet,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { formatDate, useTranslation } from '@/shared/i18n';

import { clock, countSets } from '../model/session.logic';
import { sessionRoutes } from '../model/session.routes';
import { useSessionStore } from '../model/session.store';
import { sessionIds } from '../session.testids';

/** "Sessão recuperada": offered when the app reopens with a workout in progress (paused). */
export function RecoverSheetScreen() {
  const router = useRouter();
  const { t } = useTranslation('session');
  const showToast = useFeedbackStore((s) => s.showToast);
  const setMiniPlayer = useFeedbackStore((s) => s.setMiniPlayer);
  const session = useSessionStore((s) => s.session);
  const seedRecoveredSession = useSessionStore((s) => s.seedRecoveredSession);
  const pause = useSessionStore((s) => s.pause);
  const resume = useSessionStore((s) => s.resume);
  const finish = useSessionStore((s) => s.finish);
  const endSession = useSessionStore((s) => s.endSession);
  const [discardArmed, setDiscardArmed] = useState(false);

  // A recovered session is always paused; with nothing active (deep link / QA) a mock one is seeded.
  useLayoutEffect(() => {
    seedRecoveredSession();
    pause();
  }, [seedRecoveredSession, pause]);

  const counts = session ? countSets(session) : { done: 0, total: 0 };
  const close = () => router.back();
  const onResume = () => {
    resume();
    router.replace(sessionRoutes.session());
  };
  const onReview = () => {
    finish();
    router.replace(sessionRoutes.summary());
  };
  const onDiscard = () => {
    if (!discardArmed) {
      setDiscardArmed(true);
      return;
    }
    endSession();
    setMiniPlayer(null);
    showToast(t('recover.discarded'));
    close();
  };

  return (
    <Sheet testID={sessionIds.recoverSheet} title={t('recover.eyebrow')} onClose={close}>
      <VStack gap="ml" pb="sm">
        <Heading testID={sessionIds.recoverTitle} level={1}>
          {session ? t('recover.title', { name: session.name, focus: session.focus }) : ''}
        </Heading>
        <Text testID={sessionIds.recoverLine} variant="body">
          {session
            ? t('recover.line', {
                time: formatDate(new Date(session.startedAt), { timeStyle: 'short' }),
                done: counts.done,
                total: counts.total,
                elapsed: clock(session.elapsedSec),
              })
            : ''}
        </Text>
        <Text variant="secondary" color="text2">
          {t('recover.body')}
        </Text>
        <Button
          testID={sessionIds.recoverResume}
          label={t('recover.resume')}
          size="xl"
          fullWidth
          onPress={onResume}
        />
        <Button
          testID={sessionIds.recoverReview}
          label={t('recover.review')}
          variant="surface"
          size="lg"
          fullWidth
          onPress={onReview}
        />
        <HStack gap="sm">
          <Box flex={1}>
            <Pressable
              testID={sessionIds.recoverLater}
              onPress={close}
              accessibilityLabel={t('recover.later')}
              style={styles.textButton}
            >
              <Text variant="bodySemibold" color="text2">
                {t('recover.later')}
              </Text>
            </Pressable>
          </Box>
          <Box flex={1}>
            <Pressable
              testID={sessionIds.recoverDiscard}
              onPress={onDiscard}
              accessibilityLabel={discardArmed ? t('recover.confirm') : t('recover.discard')}
              style={styles.textButton}
            >
              <Text
                testID={`${sessionIds.recoverDiscard}.label`}
                variant="bodySemibold"
                color="danger"
              >
                {discardArmed ? t('recover.confirm') : t('recover.discard')}
              </Text>
            </Pressable>
          </Box>
        </HStack>
      </VStack>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  textButton: { height: 44, alignItems: 'center', justifyContent: 'center' },
});
