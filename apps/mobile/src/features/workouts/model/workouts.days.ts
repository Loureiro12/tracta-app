/** "2026-10-19" → local Date (avoids the UTC shift of `new Date(iso)`). */
export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export const DAY_KEYS = [
  'days.mon',
  'days.tue',
  'days.wed',
  'days.thu',
  'days.fri',
  'days.sat',
  'days.sun',
] as const;

export const DAY_FULL_KEYS = [
  'daysFull.mon',
  'daysFull.tue',
  'daysFull.wed',
  'daysFull.thu',
  'daysFull.fri',
  'daysFull.sat',
  'daysFull.sun',
] as const;

/** Short weekday key for a 0-based (Monday) index. */
export function dayKey(i: number): (typeof DAY_KEYS)[number] {
  return DAY_KEYS[i] ?? DAY_KEYS[0];
}

/** Full weekday key for a 0-based (Monday) index. */
export function dayFullKey(i: number): (typeof DAY_FULL_KEYS)[number] {
  return DAY_FULL_KEYS[i] ?? DAY_FULL_KEYS[0];
}
