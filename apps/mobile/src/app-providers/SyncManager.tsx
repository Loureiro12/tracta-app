import { useEffect, useRef } from 'react';

import { AppState } from 'react-native';

import { prefetchSessionRoutines } from '@/features/session';
import { prefetchTrainingData } from '@/features/workouts';
import { ApiError, queryClient } from '@/shared/api';
import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';
import { isOnline, useIsOnline } from '@/shared/network';
import { flushOutbox, useOutboxStatus } from '@/shared/outbox';
import { useSession } from '@/shared/session';

/** A queue that stays stuck on a connected device (flaky network, server down) tries again. */
const RETRY_MS = 60_000;

/**
 * Keeps the device and the server in step: sends queued workouts whenever that may work, keeps
 * what a workout needs cached for later, and shows the "No internet" / "Sync failed" strips.
 * Renders nothing.
 */
export function SyncManager() {
  const { t } = useTranslation('common');
  const { user } = useSession();
  const userId = user?.id;
  const online = useIsOnline();
  const { pending, failed } = useOutboxStatus(userId);
  const setBanner = useFeedbackStore((s) => s.setBanner);
  const showToast = useFeedbackStore((s) => s.showToast);
  const bannerShown = useRef(false);

  useEffect(() => {
    if (!userId || !online) return;
    void flushOutbox(userId, { retryFailed: true });
    void prefetchTrainingData(userId);
    void prefetchSessionRoutines();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flushOutbox(userId, { retryFailed: true });
    });
    return () => subscription.remove();
  }, [userId, online]);

  useEffect(() => {
    if (!userId || !online || pending === 0) return;
    const timer = setInterval(() => void flushOutbox(userId), RETRY_MS);
    return () => clearInterval(timer);
  }, [userId, online, pending]);

  useEffect(() => {
    if (!online) {
      bannerShown.current = true;
      setBanner({
        variant: 'offline',
        title: t('sync.offlineTitle'),
        description:
          pending > 0 ? t('sync.offlineWaiting', { count: pending }) : t('sync.offlineIdle'),
      });
    } else if (failed > 0 && userId) {
      bannerShown.current = true;
      setBanner({
        variant: 'sync',
        title: t('sync.failedTitle'),
        description: t('sync.failedDescription', { count: failed }),
        ctaLabel: t('sync.retry'),
        onPressCta: () => void flushOutbox(userId, { retryFailed: true }),
      });
    } else if (bannerShown.current) {
      bannerShown.current = false;
      setBanner(null);
    }
  }, [online, pending, failed, userId, setBanner, t]);

  // Only workouts work with no internet, and only what the user asked for deserves a toast. The timeout lets this replace the toast of the mutation's
  // own onError, which runs right after this and blames a generic failure.
  useEffect(
    () =>
      queryClient.getMutationCache().subscribe((event) => {
        if (event.type !== 'updated' || event.action.type !== 'error') return;
        if (event.mutation.meta?.background) return;
        const { error } = event.action;
        if (isOnline() || !(error instanceof ApiError) || error.code !== 'network') return;
        setTimeout(() => showToast(t('sync.needsInternet')));
      }),
    [showToast, t],
  );

  return null;
}
