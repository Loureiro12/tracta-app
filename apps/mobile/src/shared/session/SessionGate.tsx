import { useEffect } from 'react';

import { useRouter, useSegments } from 'expo-router';

import { useSession } from './session.store';

/** Routes reachable without an account. */
const PUBLIC_ROOTS = new Set(['(auth)', 'design-system', 'settings']);
/**
 * (auth) routes that stay available after signing in (onboarding / settings). `signup` is here
 * because the session starts before the screen pushes `/connect`; redirecting would race it.
 */
const AUTH_ROUTES_FOR_SIGNED_IN = new Set(['connect', 'e2e-sign-in', 'signup']);

/**
 * Keeps signed-out users on the auth screens and signed-in users out of them.
 * Rendered next to the root navigator; returns nothing.
 */
export function SessionGate() {
  const { status } = useSession();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const root = segments[0] ?? '';
    const inPublic = PUBLIC_ROOTS.has(root);
    if (status === 'signedOut' && !inPublic) {
      router.replace('/welcome');
    } else if (
      status === 'signedIn' &&
      root === '(auth)' &&
      !AUTH_ROUTES_FOR_SIGNED_IN.has(segments[1] ?? '')
    ) {
      router.replace('/');
    }
  }, [status, segments, router]);

  return null;
}
