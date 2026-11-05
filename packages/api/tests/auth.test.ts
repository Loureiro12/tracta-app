import { randomUUID } from 'node:crypto';

import { describe, expect, inject, it } from 'vitest';

import { account, auth } from '../src';
import { adminClient, anonClient, createTestUser, PASSWORD } from './helpers';
import { createTractaClient } from '../src/client';

describe('auth', () => {
  it('signs up, bootstraps the account and keeps the session', async () => {
    const client = anonClient();
    const email = `${randomUUID()}@test.local`;
    const user = await auth.signUp(client, {
      name: 'Lucas Andrade',
      email,
      password: 'Tracta2026',
    });

    expect(user.email).toBe(email);
    expect(await auth.getCurrentUser(client)).toEqual(user);
    const me = await account.getAccount(client);
    expect(me.profile.name).toBe('Lucas Andrade');
    expect(me.settings.units).toBe('kg');
    expect(me.goals).toEqual({ steps: 10000, sleepMinutes: 450, workoutsPerWeek: 4, runKm: 15 });

    await adminClient().auth.admin.deleteUser(user.id);
  });

  it('signs up an address a friend invited by e-mail, keeping the chosen name', async () => {
    const email = `${randomUUID()}@test.local`;
    const { data, error } = await adminClient().auth.admin.inviteUserByEmail(email, {
      data: { invited_by: randomUUID() },
    });
    if (error) throw error;

    const client = anonClient();
    const user = await auth.signUp(client, { name: 'Nina Invited', email, password: 'Tracta2026' });
    expect(user.id).toBe(data.user.id);
    expect((await account.getAccount(client)).profile.name).toBe('Nina Invited');

    await adminClient().auth.admin.deleteUser(user.id);
  });

  it('rejects weak passwords and invalid e-mails before calling the server', async () => {
    const client = anonClient();
    await expect(
      auth.signUp(client, { name: 'X', email: 'not-an-email', password: 'Tracta2026' }),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    await expect(
      auth.signUp(client, { name: 'X', email: `${randomUUID()}@test.local`, password: 'short' }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('rejects an e-mail that is already registered', async () => {
    const existing = await createTestUser('Existing');
    await expect(
      auth.signUp(anonClient(), { name: 'Dup', email: existing.email, password: 'Tracta2026' }),
    ).rejects.toMatchObject({ code: 'email_taken' });
  });

  it('signs in with the right password and maps wrong credentials', async () => {
    const existing = await createTestUser('Signer');
    const client = anonClient();
    await expect(
      auth.signIn(client, { email: existing.email, password: 'wrong-password' }),
    ).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    const user = await auth.signIn(client, { email: existing.email, password: PASSWORD });
    expect(user.id).toBe(existing.id);
  });

  it('signs out and notifies listeners', async () => {
    const { client } = await createTestUser('Leaver');
    const events: (string | null)[] = [];
    const unsubscribe = auth.onAuthChange(client, (u) => events.push(u?.id ?? null));
    await auth.signOut(client);
    unsubscribe();
    expect(await auth.getCurrentUser(client)).toBeNull();
    expect(events.at(-1)).toBeNull();
  });

  it('changes the password only when the current one is correct', async () => {
    const user = await createTestUser('Changer');
    await expect(auth.changePassword(user.client, 'nope', 'NewPass2026')).rejects.toMatchObject({
      code: 'invalid_credentials',
    });
    await expect(auth.changePassword(user.client, PASSWORD, 'weak')).rejects.toMatchObject({
      code: 'weak_password',
    });
    await auth.changePassword(user.client, PASSWORD, 'NewPass2026');
    await expect(
      auth.signIn(anonClient(), { email: user.email, password: 'NewPass2026' }),
    ).resolves.toMatchObject({
      id: user.id,
    });
  });

  it('accepts password reset requests without revealing whether the e-mail exists', async () => {
    await expect(
      auth.sendPasswordReset(anonClient(), `${randomUUID()}@test.local`),
    ).resolves.toBeUndefined();
    await expect(auth.sendPasswordReset(anonClient(), 'bad')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('keeps an expired session apart from no session when the network is down', async () => {
    const { email } = await createTestUser();
    const stored = new Map<string, string>();
    const storage = {
      getItem: (k: string) => stored.get(k) ?? null,
      setItem: (k: string, v: string) => void stored.set(k, v),
      removeItem: (k: string) => void stored.delete(k),
    };
    const options = { url: inject('supabaseUrl'), key: inject('anonKey'), storage };
    const online = createTractaClient(options);
    await auth.signIn(online, { email, password: PASSWORD });
    await online.auth.stopAutoRefresh();

    // The token expired while the app was closed, and now there is no network to refresh it.
    const [key, raw] = [...stored.entries()].find(([k]) => k.endsWith('-auth-token'))!;
    stored.set(key, JSON.stringify({ ...JSON.parse(raw), expires_at: 1 }));
    const offline = createTractaClient({
      ...options,
      fetch: () => Promise.reject(new TypeError('Network request failed')),
    });
    await offline.auth.stopAutoRefresh();

    expect(await auth.restoreUser(offline)).toEqual({ user: null, unreachable: true });
    expect(stored.has(key)).toBe(true);

    const signedOut = await auth.restoreUser(anonClient());
    expect(signedOut).toEqual({ user: null, unreachable: false });
    // getSession keeps retrying the refresh for ~30 s before it reports the failure.
  }, 60_000);
});
