import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { account, auth } from '../src';
import { adminClient, anonClient, createTestUser, PASSWORD } from './helpers';

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
});
