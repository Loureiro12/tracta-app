import { Icon } from './Icon';
import { HStack, VStack } from '../Stack/Stack';
import { Text } from '../Text/Text';

import type { IconName } from './Icon';

const ID = 'ds.icon';
const names: IconName[] = [
  'home',
  'heart',
  'activity',
  'calendar',
  'user',
  'bell',
  'sliders',
  'plus',
  'check',
  'chevron-right',
  'share',
  'x',
];

export function IconGallery() {
  return (
    <VStack testID={`${ID}.gallery`}>
      <HStack gap="md" wrap="wrap">
        {names.map((name) => (
          <Icon key={name} testID={`${ID}.${name}`} name={name} size={24} />
        ))}
      </HStack>
      <HStack gap="md">
        <Icon testID={`${ID}.brand`} name="zap" size={24} color="brand" />
        <Icon testID={`${ID}.danger`} name="trash-2" size={24} color="danger" />
        <Text testID={`${ID}.caption`} color="text2">
          Feather line icons
        </Text>
      </HStack>
    </VStack>
  );
}
