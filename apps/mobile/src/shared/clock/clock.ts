import { env } from '@/shared/config/env';

/**
 * Single source of "now" for the app. E2E builds freeze the date (env.fixedToday) so the
 * demo data seeded for October 2026 lines up with what the flows assert; the time of day
 * keeps running so timers still work.
 */
export function now(): Date {
  const real = new Date();
  if (!env.fixedToday) return real;
  const [y, m, d] = env.fixedToday.split('-').map(Number);
  const fixed = new Date(real);
  fixed.setFullYear(y ?? real.getFullYear(), (m ?? 1) - 1, d ?? 1);
  return fixed;
}

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

export function today(): string {
  return toDateKey(now());
}
