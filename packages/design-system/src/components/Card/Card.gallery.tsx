import { useState } from 'react';

import { Card } from './Card';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { CardVariant } from './Card';

const ID = 'ds.card';
const variants: CardVariant[] = ['surface', 'ink', 'outline', 'tint', 'warn', 'social', 'fill'];

export function CardGallery() {
  const [pressed, setPressed] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      {variants.map((variant) => (
        <Card key={variant} testID={`${ID}.${variant}`} variant={variant}>
          <Text color={variant === 'ink' ? 'textOnInk' : 'text'}>{variant}</Text>
        </Card>
      ))}
      <Card testID={`${ID}.pressable`} onPress={() => setPressed((n) => n + 1)}>
        <Text testID={`${ID}.pressable.count`}>{`Pressed ${pressed} times`}</Text>
      </Card>
    </VStack>
  );
}
