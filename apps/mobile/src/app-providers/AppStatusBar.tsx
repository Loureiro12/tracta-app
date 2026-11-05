import { StatusBar } from 'expo-status-bar';

import { useTheme } from '@tracta/design-system';

/**
 * Follows the app's theme, not the device's: `style="auto"` reads the OS appearance, so a light
 * theme on a device in dark mode got light icons over a light background.
 */
export function AppStatusBar() {
  const { scheme } = useTheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}
