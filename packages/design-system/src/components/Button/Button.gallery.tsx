import { useState } from 'react';

import { Button } from './Button';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { ButtonVariant } from './Button';

const ID = 'ds.button';
const variants: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

export function ButtonGallery() {
  const [last, setLast] = useState<string>('none');
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.last-pressed`}>{`Last pressed: ${last}`}</Text>
      {variants.map((variant) => (
        <Button
          key={variant}
          testID={`${ID}.${variant}`}
          label={variant}
          variant={variant}
          onPress={() => setLast(variant)}
        />
      ))}
      <Button
        testID={`${ID}.disabled`}
        label="disabled"
        disabled
        onPress={() => setLast('disabled')}
      />
      <Button testID={`${ID}.loading`} label="loading" loading onPress={() => setLast('loading')} />
      <Button
        testID={`${ID}.full-width`}
        label="full width"
        fullWidth
        size="lg"
        onPress={() => setLast('full-width')}
      />
    </VStack>
  );
}
