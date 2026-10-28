import { Heading, Text } from './Text';
import { typography } from '../../tokens/typography';
import { VStack } from '../Stack/Stack';

import type { TypographyVariant } from '../../tokens/typography';

const ID = 'ds.text';
const variants = Object.keys(typography) as TypographyVariant[];

export function TextGallery() {
  return (
    <VStack testID={`${ID}.gallery`} gap="sm">
      <Heading testID={`${ID}.heading`} level={2}>
        Heading level 2
      </Heading>
      {variants.map((variant) => (
        <Text key={variant} testID={`${ID}.variant.${variant}`} variant={variant}>
          {variant}
        </Text>
      ))}
      <Text testID={`${ID}.color.danger`} color="danger">
        danger color
      </Text>
      <Text testID={`${ID}.color.muted`} color="text2">
        muted color
      </Text>
    </VStack>
  );
}
