import { Button, Card, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';
import { useAccount } from '@/shared/session';

import type { Account } from '@/shared/api';
import type { ReactNode } from 'react';

type AccountGateProps = {
  /** Prefix for the loading/error testIDs (`<testID>.loading`, `<testID>.error`). */
  testID: string;
  children: (account: Account) => ReactNode;
};

/** Renders `children` with the signed-in account; a loading line or an error card otherwise. */
export function AccountGate({ testID, children }: AccountGateProps) {
  const { t } = useTranslation('profile');
  const query = useAccount();
  if (query.data) return children(query.data);
  if (query.isError)
    return (
      <Card testID={`${testID}.error`} padding="xl" py="lg" gap="sm">
        <Text variant="bodySemibold">{t('state.errorTitle')}</Text>
        <Text variant="secondary" color="text2">
          {t('state.errorDescription')}
        </Text>
        <Button
          testID={`${testID}.error.retry`}
          label={t('state.retry')}
          variant="surface"
          size="sm"
          onPress={() => void query.refetch()}
        />
      </Card>
    );
  return (
    <Text testID={`${testID}.loading`} variant="secondary" color="text2">
      {t('state.loading')}
    </Text>
  );
}
