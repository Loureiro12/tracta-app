import { Chip } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

/** Small ink "PRO" badge shown next to gated features. */
export function ProChip({ testID }: { testID: string }) {
  const { t } = useTranslation('common');
  return <Chip testID={testID} label={t('pro.badge')} tone="ink" size="sm" />;
}
