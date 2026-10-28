import { useState } from 'react';

import { IconButton } from './IconButton';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.icon-button';

export function IconButtonGallery() {
  const [count, setCount] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="sm">
        <IconButton
          testID={`${ID}.fill`}
          icon="sliders"
          label="Edit"
          onPress={() => setCount((c) => c + 1)}
        />
        <IconButton
          testID={`${ID}.badge`}
          icon="bell"
          label="Notifications"
          badge={3}
          onPress={() => setCount((c) => c + 1)}
        />
        <IconButton
          testID={`${ID}.surface`}
          icon="share"
          label="Share"
          variant="surface"
          onPress={() => setCount((c) => c + 1)}
        />
        <IconButton
          testID={`${ID}.ink`}
          icon="plus"
          label="Add"
          variant="ink"
          onPress={() => setCount((c) => c + 1)}
        />
        <IconButton
          testID={`${ID}.disabled`}
          icon="x"
          label="Disabled"
          disabled
          onPress={() => setCount((c) => c + 1)}
        />
      </HStack>
      <Text testID={`${ID}.count`}>{`Pressed ${count} times`}</Text>
    </VStack>
  );
}
