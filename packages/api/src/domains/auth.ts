import { z } from 'zod';

import { ApiError, toApiError } from '../errors';

import type { TractaClient } from '../client';
import type { Session } from '@supabase/supabase-js';

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

export type AuthUser = { id: string; email: string };

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? '' };
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

/** Subscribes to sign-in/sign-out/token refresh. Returns the unsubscribe function. */
export function onAuthChange(
  client: TractaClient,
  listener: (user: AuthUser | null) => void,
): () => void {
  const { data } = client.auth.onAuthStateChange((_event, session) =>
    listener(toAuthUser(session)),
  );
  return () => data.subscription.unsubscribe();
}
