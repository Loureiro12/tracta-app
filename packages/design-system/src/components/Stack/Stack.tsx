import { Box } from '../Box/Box';

import type { BoxProps } from '../Box/Box';

export type StackProps = Omit<BoxProps, 'direction'> & { gap?: BoxProps['gap'] };

/** Vertical stack with a token gap. */
export function VStack({ gap = 'md', ...rest }: StackProps) {
  return <Box direction="column" gap={gap} {...rest} />;
}

/** Horizontal stack with a token gap. */
export function HStack({ gap = 'md', align = 'center', ...rest }: StackProps) {
  return <Box direction="row" gap={gap} align={align} {...rest} />;
}
