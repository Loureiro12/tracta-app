import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { auth, invites, social } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

/**
 * Exercises the invite-friend edge function end to end: it must be served
 * (`supabase start` with edge-runtime, or `supabase functions serve`). Mail goes to Mailpit.
 */
const MAILPIT_URL = process.env.MAILPIT_URL ?? 'http://127.0.0.1:55324';

const invitedEmails: string[] = [];
const newAddress = () => {
  const email = `invitee-${randomUUID()}@test.local`;
  invitedEmails.push(email);
  return email;
};

type MailSummary = { To: { Address: string }[]; Subject: string };

async function mailsTo(email: string, { wait = true } = {}): Promise<MailSummary[]> {
  const deadline = Date.now() + (wait ? 8_000 : 0);
  for (;;) {
    const res = await fetch(
      `${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`,
    );
    const body = (await res.json()) as { messages: MailSummary[] };
    if (body.messages.length > 0 || Date.now() >= deadline) return body.messages;
    await new Promise((r) => setTimeout(r, 250));
  }
}

afterAll(async () => {
  // Invited addresses get an unconfirmed Auth user; remove the ones the tests left behind.
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ghosts = (data?.users ?? []).filter((u) => invitedEmails.includes(u.email ?? ''));
  await Promise.all(ghosts.map((u) => admin.auth.admin.deleteUser(u.id)));
});

describe('invites · by e-mail', () => {
  it('requires a session and a valid address', async () => {
    await expect(invites.inviteByEmail(anonClient(), newAddress())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
    const a = await createTestUser('Ines');
    await expect(invites.inviteByEmail(a.client, 'not-an-email')).rejects.toMatchObject({
      code: 'validation',
    });
    // Checked by the server: inviting yourself.
    await expect(invites.inviteByEmail(a.client, a.email.toUpperCase())).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('e-mails a new address, and its sign-up turns the invite into a friend request', async () => {
    const a = await createTestUser('Ines Inviter');
    const email = newAddress();

    await invites.inviteByEmail(a.client, ` ${email.toUpperCase()} `, 'en');
    const mails = await mailsTo(email);
    expect(mails).toHaveLength(1);
    expect(mails[0]?.To[0]?.Address).toBe(email);

    const pending = await invites.listEmailInvites(a.client);
    expect(pending).toMatchObject([{ email, status: 'pending', acceptedAt: null }]);

    // Inviting again is deduplicated: no second e-mail, still one invite.
    await invites.inviteByEmail(a.client, email);
    expect(await invites.listEmailInvites(a.client)).toHaveLength(1);
    expect(await mailsTo(email, { wait: false })).toHaveLength(1);

    // The invitee installs the app and signs up with the invited address.
    const invitee = anonClient();
    const user = await auth.signUp(invitee, { name: 'Nora New', email, password: 'Tracta2026' });
    const requests = await social.listRequests(invitee);
    expect(requests.incoming.map((r) => r.person)).toEqual([
      { id: a.id, name: 'Ines Inviter', handle: null },
    ]);
    expect(await invites.listEmailInvites(a.client)).toEqual([]);
    expect(await invites.listEmailInvites(a.client, 'accepted')).toMatchObject([{ email }]);
    // The inviter sees the request waiting for the new user (with their chosen name).
    expect((await social.listRequests(a.client)).outgoing.map((r) => r.person.name)).toEqual([
      'Nora New',
    ]);

    await adminClient().auth.admin.deleteUser(user.id);
  });

  it('sends a friend request (no e-mail) when the address already has an account', async () => {
    const a = await createTestUser('Ines');
    const b = await createTestUser('Bea Existing');

    await expect(invites.inviteByEmail(a.client, b.email)).resolves.toBeUndefined();
    expect((await social.listRequests(b.client)).incoming.map((r) => r.person.id)).toEqual([a.id]);
    expect(await mailsTo(b.email, { wait: false })).toEqual([]);
    expect(await invites.listEmailInvites(a.client)).toEqual([]);
  });

  it('revokes a pending invite; nobody else sees or revokes it', async () => {
    const a = await createTestUser('Ines');
    const other = await createTestUser('Otto');
    await invites.inviteByEmail(a.client, newAddress());
    const [invite] = await invites.listEmailInvites(a.client);
    if (!invite) throw new Error('invite not recorded');

    expect(await invites.listEmailInvites(other.client)).toEqual([]);
    await expect(invites.revokeEmailInvite(other.client, invite.id)).rejects.toMatchObject({
      code: 'not_found',
    });

    await invites.revokeEmailInvite(a.client, invite.id);
    expect(await invites.listEmailInvites(a.client)).toEqual([]);
    expect(await invites.listEmailInvites(a.client, 'expired')).toMatchObject([{ id: invite.id }]);
    await expect(invites.revokeEmailInvite(a.client, invite.id)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('enforces the daily limit', async () => {
    const a = await createTestUser('Ines');
    const { error } = await adminClient()
      .from('email_invites')
      .insert(
        Array.from({ length: 20 }, (_, i) => ({ inviter_id: a.id, email: `bulk${i}@example.com` })),
      );
    if (error) throw error;
    await expect(invites.inviteByEmail(a.client, newAddress())).rejects.toMatchObject({
      code: 'rate_limited',
    });
  });
});
