import { Box } from '../Box/Box';

import type { MaybeTestable } from '../../testing/test-id';
import type { SpacingToken } from '../../tokens/spacing';

export type DividerProps = MaybeTestable & {
  strong?: boolean;
  /** Vertical margin token. */
  my?: SpacingToken;
};

/** 1px hairline in the handoff's divider color. */
export function Divider({ strong = false, my, testID }: DividerProps) {
  return (
    <Box
      testID={testID}
      bg={strong ? 'dividerStrong' : 'divider'}
      {...(my ? { my } : {})}
      style={styles.line}
    />
  );
}

const styles = { line: { height: 1, alignSelf: 'stretch' } as const };
