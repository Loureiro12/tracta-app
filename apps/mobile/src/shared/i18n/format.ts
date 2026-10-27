import { getCurrentLocale } from './i18n';

/** Locale-aware formatting helpers. Always use these instead of toLocaleString() with no args. */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(getCurrentLocale(), options).format(value);
}

export function formatCurrency(value: number, currency: string): string {
  return formatNumber(value, { style: 'currency', currency });
}

export function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  return new Intl.DateTimeFormat(getCurrentLocale(), options).format(date);
}
