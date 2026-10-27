import { useState } from 'react';

import { Button, HStack, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

export function Counter() {
  const { t } = useTranslation('home');
  const [count, setCount] = useState(0);
  return (
    <VStack gap="sm">
      <Text testID={homeIds.counterValue} variant="headingMd">
        {t('counter.taps', { count })}
      </Text>
      <HStack gap="sm">
        <Button
          testID={homeIds.counterIncrement}
          label={t('counter.tap')}
          onPress={() => setCount((c) => c + 1)}
        />
        <Button
          testID={homeIds.counterReset}
          label={t('counter.reset')}
          variant="secondary"
          onPress={() => setCount(0)}
        />
      </HStack>
    </VStack>
  );
}
