import { useState } from 'react';

import { Chip } from './Chip';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { ChipTone } from './Chip';

const ID = 'ds.chip';
const tones: ChipTone[] = [
  'neutral',
  'brand',
  'ink',
  'run',
  'sleep',
  'social',
  'success',
  'warn',
  'danger',
];

export function ChipGallery() {
  const [selected, setSelected] = useState<string>('neutral');
  return (
    <VStack testID={`${ID}.gallery`}>
      <Text testID={`${ID}.selected`}>{`Selected: ${selected}`}</Text>
      <HStack gap="sm" wrap="wrap">
        {tones.map((tone) => (
          <Chip
            key={tone}
            testID={`${ID}.${tone}`}
            label={tone}
            tone={tone}
            selected={selected === tone}
            onPress={() => setSelected(tone)}
          />
        ))}
      </HStack>
      <HStack gap="sm">
        <Chip testID={`${ID}.small`} label="PRO" tone="brand" size="sm" />
        <Chip testID={`${ID}.static`} label="Conectado" tone="success" size="sm" />
      </HStack>
    </VStack>
  );
}
