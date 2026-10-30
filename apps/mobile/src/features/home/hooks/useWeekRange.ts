import { formatDate, useTranslation } from '@/shared/i18n';

import { addDays, dateOfKey } from '../lib/week';

const shortMonth = (date: Date) => formatDate(date, { month: 'short' }).replace('.', '');

/** "Oct 19–25" / "19–25 out" for the Monday–Sunday week starting on `weekStart`. */
export function useWeekRange(weekStart: string): string {
  const { t } = useTranslation('home');
  const from = dateOfKey(weekStart);
  const to = dateOfKey(addDays(weekStart, 6));
  const parts = {
    from: from.getDate(),
    to: to.getDate(),
    month: shortMonth(from),
    fromMonth: shortMonth(from),
    toMonth: shortMonth(to),
  };
  return from.getMonth() === to.getMonth()
    ? t('weekly.range', parts)
    : t('weekly.rangeCross', parts);
}
