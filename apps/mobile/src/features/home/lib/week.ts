/** Monday-based week math over local YYYY-MM-DD keys. */
import { toDateKey } from '@/shared/clock';

/** Local Date at midnight of a YYYY-MM-DD key. */
export function dateOfKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/** Monday (YYYY-MM-DD) of the week before the one containing `date`: the last full week. */
export function previousWeekStart(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) - 7);
  return toDateKey(d);
}

/** `key` moved by `days`. */
export function addDays(key: string, days: number): string {
  const d = dateOfKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}
