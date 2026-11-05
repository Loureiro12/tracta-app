import { useEffect, useState } from 'react';

import { auth, supabase, useMutation } from '@/shared/api';

import { availableProviders, signInWithProvider } from './socialSignIn';

import type { SocialProvider } from '../model/auth.mock';
import type { SignInInput, SignUpInput } from '@tracta/api';

/** Sign in with e-mail and password. The session store updates through SessionProvider. */
export function useSignIn() {
  return useMutation({ mutationFn: (input: SignInInput) => auth.signIn(supabase, input) });
}

/** Create the account (profile, settings and goals are bootstrapped by the database). */
export function useSignUp() {
  return useMutation({ mutationFn: (input: SignUpInput) => auth.signUp(supabase, input) });
}

/** Send the password-reset e-mail. Resolves for unknown e-mails too (no account enumeration). */
export function usePasswordReset() {
  return useMutation({ mutationFn: (email: string) => auth.sendPasswordReset(supabase, email) });
}

/** Apple or Google; resolves null when the user backs out of the provider's sheet. */
export function useSocialSignIn() {
  return useMutation({ mutationFn: (provider: SocialProvider) => signInWithProvider(provider) });
}

/** The sign-in providers this device offers (none until they are known). */
export function useSocialProviders(): SocialProvider[] {
  const [providers, setProviders] = useState<SocialProvider[]>([]);
  useEffect(() => {
    let active = true;
    void availableProviders().then((p) => active && setProviders(p));
    return () => {
      active = false;
    };
  }, []);
  return providers;
}
