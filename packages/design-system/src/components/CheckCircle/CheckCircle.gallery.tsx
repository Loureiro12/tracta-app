import { useState } from 'react';

import { CheckCircle } from './CheckCircle';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.check-circle';

export function CheckCircleGallery() {
  const [checked, setChecked] = useState(false);
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md">
        <CheckCircle
          testID={`${ID}.toggle`}
          checked={checked}
          onPress={() => setChecked((c) => !c)}
          accessibilityLabel="toggle"
        />
        <CheckCircle testID={`${ID}.success`} checked color="success" />
        <CheckCircle testID={`${ID}.static`} checked={false} />
        <Text testID={`${ID}.value`}>{checked ? 'checked' : 'unchecked'}</Text>
      </HStack>
    </VStack>
  );
}
