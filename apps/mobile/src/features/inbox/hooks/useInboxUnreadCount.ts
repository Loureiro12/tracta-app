import { useNotifications } from '../api/useNotifications';

/** Number of unread notifications; drives the bell badge on Home (shares the inbox cache). */
export function useInboxUnreadCount(): number {
  const { data } = useNotifications();
  return data ? data.filter((n) => n.readAt === null).length : 0;
}
