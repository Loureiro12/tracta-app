import { inboxItems } from '../model/inbox.mock';
import { useInboxStore } from '../model/inbox.store';

/** Number of live (not removed) notifications still unread; drives the bell badge on Home. */
export function useInboxUnreadCount(): number {
  const read = useInboxStore((s) => s.read);
  const removed = useInboxStore((s) => s.removed);
  return inboxItems.filter((item) => !removed.includes(item.id) && !read.includes(item.id)).length;
}
