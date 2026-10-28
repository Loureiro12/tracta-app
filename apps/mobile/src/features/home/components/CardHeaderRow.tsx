import { Dot, HStack, Text } from '@tracta/design-system';

import type { SemanticColors } from '@tracta/design-system';
import type { ReactNode } from 'react';

type CardHeaderRowProps = {
  title: string;
  /** Legend dot color before the title. */
  dot?: keyof SemanticColors;
  /** Right-aligned 12px meta text, or a custom element. */
  meta?: ReactNode;
  testID?: string;
};

/** First row of the Home cards: colored dot, 14/600 title and a grey meta on the right. */
export function CardHeaderRow({ title, dot, meta, testID }: CardHeaderRowProps) {
  return (
    <HStack gap="sm" justify="space-between">
      <HStack gap="sm">
        {dot ? <Dot color={dot} /> : null}
        <Text testID={testID} variant="smallSemibold" numberOfLines={1}>
          {title}
        </Text>
      </HStack>
      {typeof meta === 'string' ? (
        <Text variant="caption" color="text2" numberOfLines={1}>
          {meta}
        </Text>
      ) : (
        meta
      )}
    </HStack>
  );
}
