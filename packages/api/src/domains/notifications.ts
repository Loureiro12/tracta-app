/** Inbox notifications (created by database triggers / the backend; clients read, mark and remove). */
import { z } from 'zod';

import { ApiError, unwrap } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

export type NotificationKind = Database['public']['Enums']['notification_kind'];

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** In-app route opened on tap ("/social"). */
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

type Row = Database['public']['Tables']['notifications']['Row'];

const uuid = z.guid();

function toNotification(r: Row): Notification {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    href: r.href,
    createdAt: r.created_at,
    readAt: r.read_at,
  };
}

async function requireUserId(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

/** Rows of a list response (an error throws the mapped ApiError). */
function rowsOf<T>(result: { data: T[] | null; error: unknown }): T[] {
  return unwrap(result) ?? [];
}

function parseId(id: string): string {
  const parsed = uuid.safeParse(id);
  if (!parsed.success) throw new ApiError('validation', 'Invalid notification id', parsed.error);
  return parsed.data;
}

/** The user's notifications, newest first. */
export async function list(client: TractaClient, limit = 100): Promise<Notification[]> {
  await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return rows.map(toNotification);
}

/** Number of unread notifications (bell badge). */
export async function unreadCount(client: TractaClient): Promise<number> {
  await requireUserId(client);
  const { count, error } = await client
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null);
  unwrap({ data: null, error });
  return count ?? 0;
}

export async function markRead(client: TractaClient, id: string): Promise<void> {
  await requireUserId(client);
  const rows = rowsOf(
    await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', parseId(id))
      .select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'notification not found');
}

export async function markAllRead(client: TractaClient): Promise<void> {
  await requireUserId(client);
  unwrap(
    await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null),
  );
}

export async function remove(client: TractaClient, id: string): Promise<void> {
  await requireUserId(client);
  const rows = rowsOf(
    await client.from('notifications').delete().eq('id', parseId(id)).select('id'),
  );
  if (rows.length === 0) throw new ApiError('not_found', 'notification not found');
}
