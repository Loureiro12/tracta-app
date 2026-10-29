import { account, auth, supabase, useMutation, useQueryClient } from '@/shared/api';
import { accountQueryKey, useSession } from '@/shared/session';

import { useProfileStore } from '../model/profile.store';

import type { Account, Goals, Settings } from '@/shared/api';
import type { SettingsPatch } from '@tracta/api';

const SETTINGS_MUTATION = ['account', 'settings'] as const;

/** Applies a settings patch to the cached account (optimistic update). */
function patchSettings(settings: Settings, patch: SettingsPatch): Settings {
  return {
    ...settings,
    ...(patch.units !== undefined ? { units: patch.units } : {}),
    ...(patch.autoRest !== undefined ? { autoRest: patch.autoRest } : {}),
    ...(patch.visibility !== undefined ? { visibility: patch.visibility } : {}),
    ...(patch.reminderMinutes !== undefined ? { reminderMinutes: patch.reminderMinutes } : {}),
    notifications: { ...settings.notifications, ...patch.notifications },
    share: { ...settings.share, ...patch.share },
  };
}

/** Invalidates the signed-in account so Home, Profile and Tour refetch it. */
function useInvalidateAccount() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  return () => queryClient.invalidateQueries({ queryKey: accountQueryKey(user?.id) });
}

/** Display name (Perfil › Editar). */
export function useUpdateProfile() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (input: { name: string }) => account.updateProfile(supabase, input),
    onSuccess: invalidate,
  });
}

/** Starts an e-mail change: the login e-mail switches only after the confirmation links. */
export function useUpdateEmail() {
  const invalidate = useInvalidateAccount();
  return useMutation({
    mutationFn: (email: string) => account.updateEmail(supabase, email),
    onSuccess: invalidate,
  });
}

/** Re-checks the current password, then sets the new one. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { current: string; next: string }) =>
      auth.changePassword(supabase, input.current, input.next),
  });
}

/**
 * Preferences (units, auto rest, notifications, reminder hour, visibility). Optimistic: the
 * cached account changes immediately, so fast taps on a stepper build on each other.
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const key = accountQueryKey(user?.id);
  return useMutation({
    mutationKey: SETTINGS_MUTATION,
    mutationFn: (patch: SettingsPatch) => account.updateSettings(supabase, patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Account>(key);
      if (previous)
        queryClient.setQueryData<Account>(key, {
          ...previous,
          settings: patchSettings(previous.settings, patch),
        });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      // Refetch once the last queued change has landed (earlier refetches would flicker).
      if (queryClient.isMutating({ mutationKey: SETTINGS_MUTATION }) <= 1)
        void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** Goals sheet ("Concluir"). */
export function useUpdateGoals() {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const key = accountQueryKey(user?.id);
  return useMutation({
    mutationFn: (goals: Goals) => account.updateGoals(supabase, goals),
    onSuccess: (goals) => {
      const previous = queryClient.getQueryData<Account>(key);
      if (previous) queryClient.setQueryData<Account>(key, { ...previous, goals });
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

/** Deletes every logged session and activity; every screen that shows history refetches. */
export function useDeleteHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => account.deleteHistory(supabase),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

/** Permanently deletes the account; the session gate then lands on the welcome screen. */
export function useDeleteAccount() {
  const reset = useProfileStore((s) => s.reset);
  return useMutation({
    mutationFn: () => account.deleteAccount(supabase),
    onSuccess: reset,
  });
}

/** Signs out; SessionProvider clears the cache and the session gate shows the welcome screen. */
export function useSignOut() {
  const reset = useProfileStore((s) => s.reset);
  return useMutation({
    mutationFn: () => auth.signOut(supabase),
    onSuccess: reset,
  });
}
