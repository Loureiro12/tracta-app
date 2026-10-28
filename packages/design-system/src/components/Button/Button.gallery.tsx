import { useState } from 'react';

import { Button } from './Button';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { ButtonSize, ButtonVariant } from './Button';

const ID = 'ds.button';
const variants: ButtonVariant[] = [
  'primary',
  'brand',
  'secondary',
  'surface',
  'onInk',
  'ghost',
  'danger',
  'dangerText',
];
const sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

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
      <HStack gap="sm" wrap="wrap">
        {sizes.map((size) => (
          <Button
            key={size}
            testID={`${ID}.size.${size}`}
            label={size}
            size={size}
            variant="secondary"
            onPress={() => setLast(size)}
          />
        ))}
      </HStack>
      <Button
        testID={`${ID}.icon`}
        label="with icon"
        icon="plus"
        variant="secondary"
        onPress={() => setLast('icon')}
      />
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
        size="xl"
        elevated
        onPress={() => setLast('full-width')}
      />
    </VStack>
  );
}
