import { useEffect } from 'react';

import { useRouter } from 'expo-router';

import { Screen, Text } from '@tracta/design-system';

import { auth, queryClient, supabase } from '@/shared/api';
import { env } from '@/shared/config/env';
import { useTranslation } from '@/shared/i18n';

import { authIds } from '../auth.testids';
import { DEMO_ACCOUNT } from '../model/auth.mock';

/**
 * E2E-only entry point (tracta://e2e-sign-in): restores the seeded demo account
 * (public.e2e_reset_demo exists only where seeds ran) and then signs in as it, so every Maestro
 * flow starts from the same state. The reset runs first because the previous flow may have
 * changed the demo password. Any other build bounces to the welcome screen.
 */
export function E2eSignInScreen() {
  const router = useRouter();
  const { t } = useTranslation('auth');

  useEffect(() => {
    if (!env.isE2E) {
      router.replace('/welcome');
      return;
    }
    let cancelled = false;
    void (async () => {
      const { error } = await supabase.rpc('e2e_reset_demo');
      if (error) throw error;
      await auth.signIn(supabase, DEMO_ACCOUNT);
      queryClient.clear();
      if (!cancelled) router.replace('/');
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <Screen testID={authIds.e2eScreen} scroll={false}>
      <Text color="text2">{t('e2e.preparing')}</Text>
    </Screen>
  );
}
