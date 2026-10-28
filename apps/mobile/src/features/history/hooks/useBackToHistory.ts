import { useCallback } from 'react';

import { useRouter } from 'expo-router';

import { historyHrefs } from '../lib/routes';

/** Pops the overlay, or lands on the Histórico tab when the screen was opened by deep link. */
export function useBackToHistory() {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(historyHrefs.tab);
  }, [router]);
}
