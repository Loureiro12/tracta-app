import { describe, expect, it } from 'vitest';

import { notifications, social } from '../src';
import { anonClient, befriend, createTestUser, uniqueHandle } from './helpers';

describe('notifications', () => {
  it('requires a session', async () => {
    await expect(notifications.list(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('are created by triggers on invite, accept, cheer and challenge invite', async () => {
    const aHandle = uniqueHandle('na');
    const bHandle = uniqueHandle('nb');
    const a = await createTestUser('Nina', { handle: aHandle });
    const b = await createTestUser('Otto', { handle: bHandle });

    const req = await social.sendRequest(a.client, bHandle);
    const [invite] = await notifications.list(b.client);
    expect(invite).toMatchObject({
      kind: 'social',
      title: 'Nina quer treinar com você',
      href: '/social',
      readAt: null,
    });

    await social.acceptRequest(b.client, req.requestId);
    expect((await notifications.list(a.client)).map((n) => n.title)).toEqual([
      'Otto aceitou seu convite',
    ]);

    await social.cheer(b.client, a.id, '2026-10-26');
    await social.createChallenge(b.client, {
      name: 'Outubro',
      kind: 'day',
      days: 7,
      startsOn: '2026-10-26',
      memberIds: [a.id],
    });
    const titles = (await notifications.list(a.client)).map((n) => n.title);
    expect(titles).toEqual(
      expect.arrayContaining(['Otto torceu por você', 'Otto convidou você para "Outubro"']),
    );
    expect(await notifications.unreadCount(a.client)).toBe(3);
  });

  it('marks one / all as read and removes, only for the owner', async () => {
    const me = await createTestUser('Reader');
    const f1 = await createTestUser('F1');
    const f2 = await createTestUser('F2');
    const other = await createTestUser('Other');
    await befriend(me, f1);
    await befriend(me, f2);
    await social.cheer(f1.client, me.id, '2026-10-26');
    await social.cheer(f2.client, me.id, '2026-10-26');

    const items = await notifications.list(me.client);
    expect(items).toHaveLength(2);
    expect(await notifications.unreadCount(me.client)).toBe(2);
    const [first, second] = items as [notifications.Notification, notifications.Notification];

    // Another user can neither read, mark nor remove them.
    expect(await notifications.list(other.client)).toEqual([]);
    await expect(notifications.markRead(other.client, first.id)).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(notifications.remove(other.client, first.id)).rejects.toMatchObject({
      code: 'not_found',
    });

    await notifications.markRead(me.client, first.id);
    expect(await notifications.unreadCount(me.client)).toBe(1);
    await notifications.markAllRead(me.client);
    expect(await notifications.unreadCount(me.client)).toBe(0);
    expect((await notifications.list(me.client)).every((n) => n.readAt !== null)).toBe(true);

    await notifications.remove(me.client, second.id);
    expect((await notifications.list(me.client)).map((n) => n.id)).toEqual([first.id]);
    await expect(notifications.remove(me.client, 'nope')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('a user cannot insert or rewrite notifications', async () => {
    const me = await createTestUser('Forger');
    const victim = await createTestUser('Victim');
    const own = await me.client
      .from('notifications')
      .insert({ owner_id: me.id, kind: 'social', title: 'fake' });
    expect(own.error?.code).toBe('42501');
    const others = await me.client
      .from('notifications')
      .insert({ owner_id: victim.id, kind: 'social', title: 'spam' });
    expect(others.error?.code).toBe('42501');

    await befriend(me, victim);
    await social.cheer(victim.client, me.id, '2026-10-26');
    const [n] = await notifications.list(me.client);
    const edit = await me.client
      .from('notifications')
      .update({ title: 'edited' })
      .eq('id', n?.id ?? '');
    expect(edit.error?.code).toBe('42501');
  });
});
