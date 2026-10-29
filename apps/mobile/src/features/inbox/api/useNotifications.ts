import { notifications, supabase, useMutation, useQuery, useQueryClient } from '@/shared/api';
import { useSession } from '@/shared/session';

/** Every notification query/mutation lives under this key (mutations share it too). */
export const notificationsKey = ['notifications'] as const;
const listKey = [...notificationsKey, 'list'] as const;

type List = notifications.Notification[];

/** The user's inbox, newest first. */
export function useNotifications() {
  const { user } = useSession();
  return useQuery({
    queryKey: listKey,
    queryFn: () => notifications.list(supabase),
    enabled: Boolean(user),
  });
}

/**
 * Optimistic inbox mutation: applies `update` to the cached list right away, rolls back on
 * error and refetches once the last pending inbox mutation settles (taps can be quick).
 */
function useInboxMutation<V>(
  mutationFn: (vars: V) => Promise<void>,
  update: (list: List, vars: V) => List,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: notificationsKey,
    mutationFn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<List>(listKey);
      if (previous) queryClient.setQueryData<List>(listKey, update(previous, vars));
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(listKey, context?.previous),
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: notificationsKey }) <= 1)
        void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}

const readNow = (n: notifications.Notification) => ({
  ...n,
  readAt: n.readAt ?? new Date().toISOString(),
});

export function useMarkRead() {
  return useInboxMutation(
    (id: string) => notifications.markRead(supabase, id),
    (list, id) => list.map((n) => (n.id === id ? readNow(n) : n)),
  );
}

export function useMarkAllRead() {
  return useInboxMutation(
    (_: void) => notifications.markAllRead(supabase),
    (list) => list.map(readNow),
  );
}

export function useRemoveNotification() {
  return useInboxMutation(
    (id: string) => notifications.remove(supabase, id),
    (list, id) => list.filter((n) => n.id !== id),
  );
}
