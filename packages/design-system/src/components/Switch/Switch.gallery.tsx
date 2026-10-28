import { useState } from 'react';

import { Switch } from './Switch';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.switch';

export function SwitchGallery() {
  const [on, setOn] = useState(false);
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <Switch
          testID={`${ID}.toggle`}
          value={on}
          onValueChange={setOn}
          accessibilityLabel="toggle"
        />
        <Text testID={`${ID}.value`}>{on ? 'on' : 'off'}</Text>
      </HStack>
      <Switch
        testID={`${ID}.disabled`}
        value
        disabled
        onValueChange={setOn}
        accessibilityLabel="disabled"
      />
    </VStack>
  );
}
