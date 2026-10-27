import { useState } from 'react';

import { Button, HStack, Text, VStack } from '@tracta/design-system';

import { pluralize } from '@/shared/lib/format';

import { homeIds } from '../home.testids';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <VStack gap="sm">
      <Text testID={homeIds.counterValue} variant="headingMd">
        {pluralize(count, 'tap')}
      </Text>
      <HStack gap="sm">
        <Button
          testID={homeIds.counterIncrement}
          label="Tap"
          onPress={() => setCount((c) => c + 1)}
        />
        <Button
          testID={homeIds.counterReset}
          label="Reset"
          variant="secondary"
          onPress={() => setCount(0)}
        />
      </HStack>
    </VStack>
  );
}
