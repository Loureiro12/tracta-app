import { useState } from 'react';

import { Segmented } from './Segmented';
import { VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

const ID = 'ds.segmented';
const options = [
  { value: 'sleep', label: 'Sono' },
  { value: 'activity', label: 'Atividade' },
  { value: 'body', label: 'Corpo' },
] as const;

export function SegmentedGallery() {
  const [value, setValue] = useState<(typeof options)[number]['value']>('sleep');
  return (
    <VStack testID={`${ID}.gallery`}>
      <Segmented testID={`${ID}.control`} options={options} value={value} onChange={setValue} />
      <Text testID={`${ID}.value`}>{`Value: ${value}`}</Text>
    </VStack>
  );
}
