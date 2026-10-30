/**
 * Friend invites by e-mail. Sending goes through the `invite-friend` edge function (it records
 * the invite and sends the Auth invite e-mail); the inviter lists and revokes their own invites.
 * When the address already has an account the server sends a friend request instead, and the
 * response is the same either way (no account enumeration).
 */
import { FunctionsHttpError } from '@supabase/supabase-js';
import { z } from 'zod';

import { ApiError, unwrap } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';
import type { ApiErrorCode } from '../errors';

export type EmailInviteStatus = Database['public']['Enums']['email_invite_status'];

export type EmailInvite = {
  id: string;
  email: string;
  /** Pending invites older than 30 days are reported as expired. */
  status: EmailInviteStatus;
  createdAt: string;
  lastSentAt: string;
  acceptedAt: string | null;
};

export type InviteLocale = 'pt-BR' | 'en';

/** Function name, also the folder in supabase/functions. */
export const INVITE_FUNCTION = 'invite-friend';
/** Invites stop waiting after this many days without a sign-up. */
export const INVITE_TTL_DAYS = 30;

export const emailInput = z.string().trim().toLowerCase().pipe(z.email().max(254));

async function requireUserId(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

const KNOWN_CODES: readonly ApiErrorCode[] = [
  'validation',
  'not_authenticated',
  'rate_limited',
  'network',
];

/** Maps an edge function failure ({ code, message } body) to an ApiError. */
async function functionError(error: unknown): Promise<ApiError> {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    const code = KNOWN_CODES.find((c) => c === body?.code);
    if (code) return new ApiError(code, body?.message ?? code, error);
    if (response.status === 401) return new ApiError('not_authenticated', 'Not signed in', error);
    return new ApiError('unknown', body?.message ?? 'Invite failed', error);
  }
  const name = (error as { name?: string } | null)?.name;
  if (name === 'FunctionsFetchError') return new ApiError('network', 'Network error', error);
  return new ApiError('unknown', (error as Error | null)?.message ?? 'Invite failed', error);
}

/**
 * Invites an e-mail address to Tracta (the e-mail copy follows `locale`).
 * Errors: validation (bad or own address), rate_limited (daily limit), network, not_authenticated.
 */
export async function inviteByEmail(
  client: TractaClient,
  email: string,
  locale: InviteLocale = 'pt-BR',
): Promise<void> {
  await requireUserId(client);
  const parsed = emailInput.safeParse(email);
  if (!parsed.success) throw new ApiError('validation', 'Invalid e-mail', parsed.error);
  const { error } = await client.functions.invoke(INVITE_FUNCTION, {
    body: { email: parsed.data, locale },
  });
  if (error) throw await functionError(error);
}

function effectiveStatus(row: { status: EmailInviteStatus; last_sent_at: string }) {
  const expired =
    row.status === 'pending' &&
    Date.now() - new Date(row.last_sent_at).getTime() > INVITE_TTL_DAYS * 86_400_000;
  return expired ? 'expired' : row.status;
}

/** The user's invites with the given status (default: pending, newest first). */
export async function listEmailInvites(
  client: TractaClient,
  status: EmailInviteStatus = 'pending',
): Promise<EmailInvite[]> {
  await requireUserId(client);
  const rows =
    unwrap(
      await client
        .from('email_invites')
        .select('id, email, status, created_at, last_sent_at, accepted_at')
        .order('last_sent_at', { ascending: false }),
    ) ?? [];
  return rows
    .map((r) => ({
      id: r.id,
      email: r.email,
      status: effectiveStatus(r),
      createdAt: r.created_at,
      lastSentAt: r.last_sent_at,
      acceptedAt: r.accepted_at,
    }))
    .filter((r) => r.status === status);
}

/** Cancels a pending invite. Errors: not_found (not mine or no longer pending). */
export async function revokeEmailInvite(client: TractaClient, inviteId: string): Promise<void> {
  await requireUserId(client);
  const id = z.guid().safeParse(inviteId);
  if (!id.success) throw new ApiError('validation', 'Invalid invite id', id.error);
  unwrap(await client.rpc('revoke_email_invite', { p_id: id.data }));
}
