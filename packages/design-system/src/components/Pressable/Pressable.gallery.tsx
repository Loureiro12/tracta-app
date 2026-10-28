import { useState } from 'react';

import { Pressable } from './Pressable';
import { Box } from '../Box/Box';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.pressable';

export function PressableGallery() {
  const [count, setCount] = useState(0);
  return (
    <VStack testID={`${ID}.gallery`}>
      <Pressable testID={`${ID}.target`} onPress={() => setCount((c) => c + 1)}>
        <Box bg="brandTint" p="lg" radius="md">
          <Text testID={`${ID}.target.label`}>Tap me</Text>
        </Box>
      </Pressable>
      <Text testID={`${ID}.count`}>{`Pressed ${count} times`}</Text>
    </VStack>
  );
}
