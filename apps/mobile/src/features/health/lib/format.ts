import { formatNumber } from '@/shared/i18n';

import type { CompareValue } from '../model/health.constants';

/** 440 → "7h 20" (locale independent, as in the handoff). */
export function hm(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}`;
}

/** A duration difference: 40 → "40 min", 75 → "1h 15". */
export function minutesLabel(minutes: number): string {
  const m = Math.abs(Math.round(minutes));
  return m >= 60 ? hm(m) : `${m} min`;
}

/** Integer with locale grouping: 6842 → "6,842" (en) / "6.842" (pt-BR). */
export function num(value: number): string {
  return formatNumber(Math.round(value));
}

/** One decimal: 4.9 → "4.9" (en) / "4,9" (pt-BR). */
export function dec1(value: number): string {
  return formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/** Up to one decimal, no trailing zero: 86 → "86", 35.5 → "35.5". */
export function dec01(value: number): string {
  return formatNumber(value, { maximumFractionDigits: 1 });
}

export function formatCompareValue(
  v: CompareValue,
  ofLabel: (hit: number, total: number) => string,
) {
  switch (v.kind) {
    case 'none':
      return '—';
    case 'text':
      return v.text;
    case 'ratio':
      return ofLabel(v.hit, v.total);
    case 'number': {
      const n =
        v.digits === undefined
          ? num(v.value)
          : formatNumber(v.value, {
              minimumFractionDigits: v.digits,
              maximumFractionDigits: v.digits,
            });
      return v.unit ? `${n} ${v.unit}` : n;
    }
  }
}

/** Day of October → "26 out" style label; the month name is passed in (i18n). */
export function dayLabel(day: number, month: string): string {
  return `${day} ${month}`;
}
