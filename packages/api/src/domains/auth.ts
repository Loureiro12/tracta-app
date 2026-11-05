import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { z } from 'zod';

import { ApiError, toApiError } from '../errors';

import type { TractaClient } from '../client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const signUpInput = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[0-9]/, 'needs a number')
    .regex(/[A-Z]/, 'needs an uppercase letter'),
});
export type SignUpInput = z.infer<typeof signUpInput>;

export const signInInput = z.object({ email: z.email(), password: z.string().min(1) });
export type SignInInput = z.infer<typeof signInInput>;

export type AuthUser = {
  id: string;
  email: string;
  /** False for accounts that only sign in with Apple or Google: there is no password to change. */
  hasPassword: boolean;
};

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const providers = (session.user.app_metadata.providers as string[] | undefined) ?? [];
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    hasPassword: providers.length === 0 || providers.includes('email'),
  };
}

export async function signUp(client: TractaClient, input: SignUpInput): Promise<AuthUser> {
  const parsed = signUpInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const { data, error } = await client.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error) throw toApiError(error);
  // With e-mail confirmations on, Supabase returns a fake user for taken addresses (no identities).
  if (data.user && data.user.identities?.length === 0)
    throw new ApiError('email_taken', 'E-mail already registered');
  const user = toAuthUser(data.session);
  if (!user) throw new ApiError('not_authenticated', 'Sign-up needs e-mail confirmation');
  // An address invited by a friend already has an (unconfirmed) account whose metadata has no
  // name, and Auth keeps that metadata: store the chosen name on the profile explicitly.
  const named = await client.from('profiles').update({ name: parsed.data.name }).eq('id', user.id);
  if (named.error) throw toApiError(named.error);
  return user;
}

export async function signIn(client: TractaClient, input: SignInInput): Promise<AuthUser> {
  const parsed = signInInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const { data, error } = await client.auth.signInWithPassword(parsed.data);
  if (error) throw toApiError(error);
  const user = toAuthUser(data.session);
  if (!user) throw new ApiError('not_authenticated', 'No session returned');
  return user;
}

export const SOCIAL_PROVIDERS = ['apple', 'google'] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const idTokenInput = z.object({
  provider: z.enum(SOCIAL_PROVIDERS),
  /** The ID token the provider's sign-in returned on the device. */
  token: z.string().min(1),
  /** The raw nonce whose SHA-256 went to the provider (it ends up inside the token). */
  nonce: z.string().min(1).optional(),
  /** Apple only sends the name on the first authorization, outside the token. */
  name: z.string().trim().max(80).optional(),
});
export type IdTokenInput = z.input<typeof idTokenInput>;

/** A first sign-in creates the account a few moments before signing it in. */
const NEW_ACCOUNT_WINDOW_MS = 60_000;

/**
 * Signs in with Apple or Google, creating the account on the first time (an existing account with
 * the same verified e-mail is the one signed in). `isNew` sends a new account to onboarding.
 */
export async function signInWithIdToken(
  client: TractaClient,
  input: IdTokenInput,
): Promise<AuthUser & { isNew: boolean }> {
  const parsed = idTokenInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const { provider, token, nonce, name } = parsed.data;
  const { data, error } = await client.auth.signInWithIdToken({
    provider,
    token,
    ...(nonce ? { nonce } : {}),
  });
  if (error) throw toApiError(error);
  const user = toAuthUser(data.session);
  if (!user || !data.user) throw new ApiError('not_authenticated', 'No session returned');
  const created = Date.parse(data.user.created_at);
  const isNew = Date.now() - created < NEW_ACCOUNT_WINDOW_MS;
  // Without a name in the token the profile got the e-mail prefix (a random relay address when the
  // user hides the e-mail): the name Apple sent replaces it on a new account.
  if (isNew && name) {
    const named = await client.from('profiles').update({ name }).eq('id', user.id);
    if (named.error) throw toApiError(named.error);
    await client.auth.updateUser({ data: { name, full_name: name } });
  }
  return { ...user, isNew };
}

export const APPLE_FUNCTION = 'apple-account';

/**
 * Hands Apple's one-time authorization code to the server, which keeps the refresh token so that
 * deleting the account can revoke the app's access at Apple.
 */
export async function linkAppleAccount(client: TractaClient, code: string): Promise<void> {
  const { error } = await client.functions.invoke(APPLE_FUNCTION, {
    body: { action: 'link', code },
  });
  if (error) throw new ApiError('unknown', 'Could not link the Apple account', error);
}

export async function signOut(client: TractaClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw toApiError(error);
}

/** Sends the reset e-mail. Always resolves for unknown e-mails (no account enumeration). */
export async function sendPasswordReset(
  client: TractaClient,
  email: string,
  redirectTo = 'tracta://reset-password',
): Promise<void> {
  const parsed = z.email().safeParse(email);
  if (!parsed.success) throw new ApiError('validation', 'Invalid e-mail', parsed.error);
  const { error } = await client.auth.resetPasswordForEmail(parsed.data, { redirectTo });
  if (error) throw toApiError(error);
}

/** Changes the password after re-checking the current one. */
export async function changePassword(
  client: TractaClient,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { data } = await client.auth.getUser();
  const email = data.user?.email;
  if (!email) throw new ApiError('not_authenticated', 'Not signed in');
  const check = await client.auth.signInWithPassword({ email, password: currentPassword });
  if (check.error)
    throw new ApiError('invalid_credentials', 'Current password is incorrect', check.error);
  const parsed = signUpInput.shape.password.safeParse(newPassword);
  if (!parsed.success) throw new ApiError('weak_password', parsed.error.message, parsed.error);
  const { error } = await client.auth.updateUser({ password: parsed.data });
  if (error) throw toApiError(error);
}

export async function getCurrentUser(client: TractaClient): Promise<AuthUser | null> {
  const { data } = await client.auth.getSession();
  return toAuthUser(data.session);
}

/**
 * The persisted session on launch. An expired token that can't be refreshed for lack of network
 * also yields no session, but the user is still signed in: `unreachable` tells the two apart.
 */
export async function restoreUser(
  client: TractaClient,
): Promise<{ user: AuthUser | null; unreachable: boolean }> {
  const { data, error } = await client.auth.getSession();
  return {
    user: toAuthUser(data.session),
    unreachable: Boolean(error && isAuthRetryableFetchError(error)),
  };
}

/** Subscribes to sign-in/sign-out/token refresh. Returns the unsubscribe function. */
export function onAuthChange(
  client: TractaClient,
  listener: (user: AuthUser | null, event: AuthChangeEvent) => void,
): () => void {
  const { data } = client.auth.onAuthStateChange((event, session) =>
    listener(toAuthUser(session), event),
  );
  return () => data.subscription.unsubscribe();
}
