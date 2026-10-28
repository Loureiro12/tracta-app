import { Switch as RNSwitch } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';

import type { Testable } from '../../testing/test-id';

export type SwitchProps = Testable & {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
};

/** Toggle: brand when on, switch-off neutral when off. */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  accessibilityLabel,
  testID,
}: SwitchProps) {
  const theme = useTheme();
  return (
    <RNSwitch
      testID={testID}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ true: theme.colors.brand, false: theme.colors.switchOff }}
      thumbColor={theme.colors.surface}
      ios_backgroundColor={theme.colors.switchOff}
    />
  );
}
