import { formatDate } from '@/shared/i18n';

const LONG: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long' };
const SHORT: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

/** "Mon, October 19" / "seg., 19 de outubro" — day headers and session dates. */
export function formatLongDate(date: Date): string {
  return formatDate(date, LONG);
}

/** "Oct 23" / "23 de out." — chart labels, recent sessions, badge dates. */
export function formatShortDate(date: Date): string {
  return formatDate(date, SHORT);
}
