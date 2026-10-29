import { Button, Card, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

type Props = {
  onRetry: () => void;
  /** Container id; the card is `<testID>.error` and its button `<testID>.error.retry`. */
  testID: string;
};

/** Short "couldn't load" card with a retry button. */
export function LoadError({ onRetry, testID }: Props) {
  const { t } = useTranslation('social');
  return (
    <Card testID={`${testID}.error`} variant="warn" radius="xl" px="lg" py="ml" gap="sm">
      <Text variant="secondary" color="warnText">
        {t('loadError.text')}
      </Text>
      <Button
        testID={`${testID}.error.retry`}
        label={t('loadError.retry')}
        variant="surface"
        size="xs"
        onPress={onRetry}
      />
    </Card>
  );
}
