import { ActivityIndicator } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { MaybeTestable } from '../../testing/test-id';
import type { SemanticColors } from '../../tokens/colors';

export type SpinnerProps = MaybeTestable & {
  /** Default text2; pick the foreground of whatever it sits on. */
  color?: keyof SemanticColors;
};

/** Indeterminate activity indicator for actions waiting on the network. */
export function Spinner({ color = 'text2', testID }: SpinnerProps) {
  const theme = useTheme();
  return <ActivityIndicator testID={testID} color={theme.colors[color]} />;
}
