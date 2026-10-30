/** Fixed options and decorative data of the Social feature (not server state). */

/** Avatar placeholders for the empty state (decorative, not real people). */
export const emptyStateAvatars: readonly { name: string; color: string }[] = [
  { name: 'Ana', color: '#B2482D' },
  { name: 'Carla', color: '#4B4FC4' },
  { name: 'Diego', color: '#7A5600' },
];

/** Avatar hues from the prototype's friend data; each person gets one from their id. */
const AVATAR_HUES = ['#B2482D', '#1F6FA8', '#4B4FC4', '#7A5600', '#B4482A', '#2D7A5A'] as const;

export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[hash % AVATAR_HUES.length] ?? AVATAR_HUES[0];
}

/** Invite link shown on screen; the shared message carries the full URL. */
export const INVITE_LINK_BASE = 'tracta.app/convite/';
export const INVITE_URL_BASE = 'https://tracta.app/convite/';

export const shareTargets = ['messages', 'whatsapp', 'email'] as const;
export type ShareTarget = (typeof shareTargets)[number];

export const challengeLengths = [7, 14, 30] as const;
export const MIN_DURATION = { min: 10, max: 90, step: 5 } as const;
