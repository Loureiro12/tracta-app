import { useState } from 'react';

import { FloatingBar } from './FloatingBar';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.floating-bar';

export function FloatingBarGallery() {
  const [opens, setOpens] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <FloatingBar
        testID={`${ID}.session`}
        title="Treino A · 12:34"
        subtitle="Supino reto · série 3 de 4"
        actionLabel="Retomar"
        onPress={() => setOpens((n) => n + 1)}
      />
      <Text testID={`${ID}.opens`}>{`Opened ${opens} times`}</Text>
    </VStack>
  );
}
