import { Box } from '@tracta/design-system';

import type { ReactNode } from 'react';

type Props = { children: ReactNode; testID?: string };

/** White 22px card hosting PersonRows (2px vertical, 16px horizontal padding). */
export function PeopleCard({ children, testID }: Props) {
  return (
    <Box testID={testID} bg="surface" radius="card" px="lg" py="xxs">
      {children}
    </Box>
  );
}
