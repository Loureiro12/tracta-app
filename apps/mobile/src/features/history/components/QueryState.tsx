import { Button, Card, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = {
  /** Prefix of the state testIDs (`<testID>.loading`, `<testID>.error`, `<testID>.error.retry`). */
  testID: string;
  error: boolean;
  onRetry: () => void;
};

/** Loading line, or a short error card with "Try again", while a History query is not ready. */
export function QueryState({ testID, error, onRetry }: Props) {
  const { t } = useTranslation('history');
  if (error) {
    return (
      <Card testID={`${testID}.error`} padding="xl" gap="sm">
        <Text variant="bodySemibold">{t('state.errorTitle')}</Text>
        <Text variant="secondary" color="text2">
          {t('state.errorLine')}
        </Text>
        <Button
          testID={`${testID}.error.retry`}
          label={t('state.retry')}
          variant="surface"
          size="sm"
          onPress={onRetry}
        />
      </Card>
    );
  }
  return (
    <Text testID={`${testID}.loading`} variant="secondary" color="text2">
      {t('state.loading')}
    </Text>
  );
}
