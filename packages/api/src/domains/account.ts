import { z } from 'zod';

import { ApiError, toApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type SettingsRow = Database['public']['Tables']['user_settings']['Row'];
type GoalsRow = Database['public']['Tables']['goals']['Row'];

export type Units = Database['public']['Enums']['units'];
export type Visibility = Database['public']['Enums']['visibility'];

export type Profile = { id: string; name: string; handle: string | null; email: string };

export type NotificationKey = 'rest' | 'sound' | 'remind' | 'daily' | 'weekly' | 'goals' | 'sync';
export type ShareKey = 'done' | 'kind' | 'streak' | 'loads' | 'prs';

export type Settings = {
  units: Units;
  autoRest: boolean;
  visibility: Visibility;
  notifications: Record<NotificationKey, boolean>;
  reminderMinutes: number;
  share: Record<ShareKey, boolean>;
};

export type Goals = { steps: number; sleepMinutes: number; workoutsPerWeek: number; runKm: number };

export type SubscriptionPlan = Database['public']['Enums']['subscription_plan'];
export type SubscriptionStatus = Database['public']['Enums']['subscription_status'];

/** Store subscription mirrored by the backend (written by the store webhook, read-only here). */
export type Subscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type Account = {
  profile: Profile;
  settings: Settings;
  goals: Goals;
  subscription: Subscription | null;
  /** PRO features unlocked: an active or trialing subscription. */
  isPro: boolean;
};

const NOTIFICATION_KEYS: NotificationKey[] = [
  'rest',
  'sound',
  'remind',
  'daily',
  'weekly',
  'goals',
  'sync',
];
const SHARE_KEYS: ShareKey[] = ['done', 'kind', 'streak', 'loads', 'prs'];

function toSettings(r: SettingsRow): Settings {
  return {
    units: r.units,
    autoRest: r.auto_rest,
    visibility: r.visibility,
    notifications: Object.fromEntries(
      NOTIFICATION_KEYS.map((k) => [k, r[`notify_${k}`]]),
    ) as Settings['notifications'],
    reminderMinutes: r.reminder_minutes,
    share: Object.fromEntries(SHARE_KEYS.map((k) => [k, r[`share_${k}`]])) as Settings['share'],
  };
}

function toGoals(r: GoalsRow): Goals {
  return {
    steps: r.steps,
    sleepMinutes: r.sleep_minutes,
    workoutsPerWeek: r.workouts_per_week,
    runKm: r.run_km,
  };
}

async function requireUserId(client: TractaClient): Promise<{ id: string; email: string }> {
  const { data } = await client.auth.getSession();
  const user = data.session?.user;
  if (!user) throw new ApiError('not_authenticated', 'Not signed in');
  return { id: user.id, email: user.email ?? '' };
}

/** Profile + settings + goals of the signed-in user, in parallel. */
export async function getAccount(client: TractaClient): Promise<Account> {
  const me = await requireUserId(client);
  const [profile, settings, goals, subscription] = await Promise.all([
    client.from('profiles').select('id, name, handle').eq('id', me.id).maybeSingle(),
    client.from('user_settings').select('*').eq('user_id', me.id).maybeSingle(),
    client.from('goals').select('*').eq('user_id', me.id).maybeSingle(),
    client.from('subscriptions').select('*').eq('user_id', me.id).maybeSingle(),
  ]);
  const p = unwrapOne(profile, 'profile');
  const sub = unwrap(subscription);
  const mapped: Subscription | null = sub
    ? {
        plan: sub.plan,
        status: sub.status,
        trialEndsAt: sub.trial_ends_at,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      }
    : null;
  return {
    profile: { id: p.id, name: p.name, handle: p.handle, email: me.email },
    settings: toSettings(unwrapOne(settings, 'settings')),
    goals: toGoals(unwrapOne(goals, 'goals')),
    subscription: mapped,
    isPro: mapped?.status === 'active' || mapped?.status === 'trialing',
  };
}

export const profileInput = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/)
    .optional(),
});

export async function updateProfile(
  client: TractaClient,
  input: z.input<typeof profileInput>,
): Promise<Profile> {
  const me = await requireUserId(client);
  const parsed = profileInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const patch: Database['public']['Tables']['profiles']['Update'] = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.handle !== undefined) patch.handle = parsed.data.handle;
  const row = unwrapOne(
    await client
      .from('profiles')
      .update(patch)
      .eq('id', me.id)
      .select('id, name, handle')
      .maybeSingle(),
    'profile',
  );
  return { id: row.id, name: row.name, handle: row.handle, email: me.email };
}

/** Changes the login e-mail (Supabase sends a confirmation link to the new address). */
export async function updateEmail(client: TractaClient, email: string): Promise<void> {
  const parsed = z.email().safeParse(email);
  if (!parsed.success) throw new ApiError('validation', 'Invalid e-mail', parsed.error);
  const { error } = await client.auth.updateUser({ email: parsed.data });
  if (error) throw toApiError(error);
}

export type SettingsPatch = Partial<Omit<Settings, 'notifications' | 'share'>> & {
  notifications?: Partial<Settings['notifications']>;
  share?: Partial<Settings['share']>;
};

const flag = z.boolean().optional();

export const settingsPatchInput = z.strictObject({
  units: z.enum(['kg', 'lb']).optional(),
  autoRest: z.boolean().optional(),
  visibility: z.enum(['friends', 'me', 'all']).optional(),
  reminderMinutes: z.number().int().min(0).max(1439).optional(),
  notifications: z
    .strictObject({
      rest: flag,
      sound: flag,
      remind: flag,
      daily: flag,
      weekly: flag,
      goals: flag,
      sync: flag,
    })
    .optional(),
  share: z
    .strictObject({ done: flag, kind: flag, streak: flag, loads: flag, prs: flag })
    .optional(),
});

export async function updateSettings(
  client: TractaClient,
  input: SettingsPatch,
): Promise<Settings> {
  const me = await requireUserId(client);
  const parsed = settingsPatchInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const patch = parsed.data;
  const row: Database['public']['Tables']['user_settings']['Update'] = {};
  if (patch.units !== undefined) row.units = patch.units;
  if (patch.autoRest !== undefined) row.auto_rest = patch.autoRest;
  if (patch.visibility !== undefined) row.visibility = patch.visibility;
  if (patch.reminderMinutes !== undefined) row.reminder_minutes = patch.reminderMinutes;
  for (const k of NOTIFICATION_KEYS)
    if (patch.notifications?.[k] !== undefined) row[`notify_${k}`] = patch.notifications[k];
  for (const k of SHARE_KEYS)
    if (patch.share?.[k] !== undefined) row[`share_${k}`] = patch.share[k];
  const data = unwrapOne(
    await client.from('user_settings').update(row).eq('user_id', me.id).select('*').maybeSingle(),
    'settings',
  );
  return toSettings(data);
}

export const goalsInput = z.object({
  steps: z.number().int().min(1000).max(50000).optional(),
  sleepMinutes: z.number().int().min(240).max(720).optional(),
  workoutsPerWeek: z.number().int().min(1).max(14).optional(),
  runKm: z.number().int().min(0).max(300).optional(),
});

export async function updateGoals(
  client: TractaClient,
  input: z.input<typeof goalsInput>,
): Promise<Goals> {
  const me = await requireUserId(client);
  const parsed = goalsInput.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  const g = parsed.data;
  const row: Database['public']['Tables']['goals']['Update'] = {};
  if (g.steps !== undefined) row.steps = g.steps;
  if (g.sleepMinutes !== undefined) row.sleep_minutes = g.sleepMinutes;
  if (g.workoutsPerWeek !== undefined) row.workouts_per_week = g.workoutsPerWeek;
  if (g.runKm !== undefined) row.run_km = g.runKm;
  return toGoals(
    unwrapOne(
      await client.from('goals').update(row).eq('user_id', me.id).select('*').maybeSingle(),
      'goals',
    ),
  );
}

/** Permanently deletes the account and every owned row (cascade). Signs out locally afterwards. */
export async function deleteAccount(client: TractaClient): Promise<void> {
  unwrap(await client.rpc('delete_account'));
  await client.auth.signOut({ scope: 'local' });
}

export type DeletedHistory = { sessions: number; activities: number };

/**
 * Deletes the signed-in user's workout history: every logged session (sets cascade) and
 * activity (runs, sports). Routines, programs, body measurements and goals are kept.
 */
export async function deleteHistory(client: TractaClient): Promise<DeletedHistory> {
  const me = await requireUserId(client);
  const sessions = unwrap(
    await client.from('workout_sessions').delete().eq('owner_id', me.id).select('id'),
  );
  const activities = unwrap(
    await client.from('activities').delete().eq('owner_id', me.id).select('id'),
  );
  return { sessions: sessions?.length ?? 0, activities: activities?.length ?? 0 };
}
