import { Text } from '../Text/Text';

import type { MaybeTestable } from '../../testing/test-id';

export type SectionLabelProps = MaybeTestable & { children: string };

/** 13px secondary label that titles a group of cards ("Metas", "Preferências"). */
export function SectionLabel({ children, testID }: SectionLabelProps) {
  return (
    <Text testID={testID} variant="secondary" color="text2">
      {children}
    </Text>
  );
}
