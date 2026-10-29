import { auth, supabase, useMutation } from '@/shared/api';

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
