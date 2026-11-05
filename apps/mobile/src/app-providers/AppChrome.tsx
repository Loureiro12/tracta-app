import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Toast } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';

type AppChromeProps = {
  /**
   * `root` is mounted once beside the root navigator. Native modal sheets cover it, so every
   * `(sheets)` screen also mounts a `sheet` host (see app/_layout.tsx screenLayout); while one is
   * mounted the root instance renders nothing, so each toast exists exactly once.
   */
  host?: 'root' | 'sheet';
};

/** Height of the status strip (AppBanner), which the toast must not cover. */
const BANNER_HEIGHT = 44;

/** Global overlay rendered above the current navigator surface: the toast. */
export function AppChrome({ host = 'root' }: AppChromeProps) {
  const insets = useSafeAreaInsets();
  const toast = useFeedbackStore((s) => s.toast);
  const banner = useFeedbackStore((s) => s.banner);
  const sheetHosts = useFeedbackStore((s) => s.sheetHosts);
  const registerSheetHost = useFeedbackStore((s) => s.registerSheetHost);
  const unregisterSheetHost = useFeedbackStore((s) => s.unregisterSheetHost);

  useEffect(() => {
    if (host !== 'sheet') return;
    registerSheetHost();
    return () => unregisterSheetHost();
  }, [host, registerSheetHost, unregisterSheetHost]);

  if (host === 'root' && sheetHosts > 0) return null;

  // Sheets read the navigator's insets, which exclude the status bar while the strip is up.
  const windowTop = initialWindowMetrics?.insets.top ?? insets.top;

  return (
    <Box
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { paddingTop: windowTop + (banner ? BANNER_HEIGHT : 0) }]}
    >
      {toast ? (
        <Box pointerEvents="none" pt="sm" align="center">
          <Toast testID="app.toast" message={toast} />
        </Box>
      ) : null}
    </Box>
  );
}
