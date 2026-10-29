import { Box, Button, Card, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = {
  /** Prefix for `<testID>.loading`, `<testID>.error` and `<testID>.retry`. */
  testID: string;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

/** Loading line or a short error card with "Try again" for a server-state query. */
export function QueryState({ testID, loading, error, onRetry }: Props) {
  const { t } = useTranslation('workouts');
  if (error) {
    return (
      <Card testID={`${testID}.error`} variant="warn" padding="lg" radius="pill" gap="sm">
        <Text variant="secondary">{t('state.error')}</Text>
        <Box align="flex-start">
          <Button
            testID={`${testID}.retry`}
            label={t('state.retry')}
            variant="secondary"
            size="xs"
            onPress={onRetry}
          />
        </Box>
      </Card>
    );
  }
  if (!loading) return null;
  return (
    <Box testID={`${testID}.loading`} py="md">
      <Text variant="secondary" color="text2">
        {t('state.loading')}
      </Text>
    </Box>
  );
}
