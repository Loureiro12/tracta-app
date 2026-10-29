import { randomUUID } from 'node:crypto';

import { afterAll, inject } from 'vitest';

import { createTractaClient } from '../src/client';

import type { TractaClient } from '../src/client';

export const PASSWORD = 'Password123';

/** Service-role client: bypasses RLS. Only for arranging data and cleaning up. */
export function adminClient(): TractaClient {
  return createTractaClient({ url: inject('supabaseUrl'), key: inject('serviceRoleKey') });
}

/** Anonymous client with an in-memory session, like a fresh app install. */
export function anonClient(): TractaClient {
  return createTractaClient({
    url: inject('supabaseUrl'),
    key: inject('anonKey'),
    persistSession: true,
  });
}

export type TestUser = { id: string; email: string; name: string; client: TractaClient };

const created: string[] = [];

/**
 * Creates a confirmed user with a unique e-mail and returns a client signed in as that user.
 * Users are deleted after the test file (their rows cascade).
 */
export async function createTestUser(
  name = 'Test User',
  options: { handle?: string } = {},
): Promise<TestUser> {
  const admin = adminClient();
  const email = `${randomUUID()}@test.local`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error || !data.user) throw error ?? new Error('createUser failed');
  created.push(data.user.id);
  if (options.handle) {
    const { error: handleError } = await admin
      .from('profiles')
      .update({ handle: options.handle })
      .eq('id', data.user.id);
    if (handleError) throw handleError;
  }
  const client = anonClient();
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw signIn.error;
  return { id: data.user.id, email, name, client };
}

/** Unique, valid @handle for tests that need one. */
export function uniqueHandle(prefix = 'u'): string {
  return `${prefix}${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

/** Makes two test users friends (arranged with the service role). */
export async function befriend(a: TestUser, b: TestUser): Promise<void> {
  const { error } = await adminClient().from('friend_requests').insert({
    from_id: a.id,
    to_id: b.id,
    status: 'accepted',
    responded_at: new Date().toISOString(),
  });
  if (error) throw error;
}

afterAll(async () => {
  const admin = adminClient();
  await Promise.all(created.splice(0).map((id) => admin.auth.admin.deleteUser(id)));
});
