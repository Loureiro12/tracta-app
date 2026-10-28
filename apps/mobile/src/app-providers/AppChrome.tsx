import { useEffect } from 'react';

import { StyleSheet } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner, Box, Toast } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';

type AppChromeProps = {
  /**
   * `root` is mounted once beside the root navigator. Native modal sheets cover it, so every
   * `(sheets)` screen also mounts a `sheet` host (see app/_layout.tsx screenLayout); while one is
   * mounted the root instance renders nothing, so each toast exists exactly once.
   */
  host?: 'root' | 'sheet';
};

/** Global overlays rendered above the current navigator surface: status banner and toast. */
export function AppChrome({ host = 'root' }: AppChromeProps) {
  const insets = useSafeAreaInsets();
  const toast = useFeedbackStore((s) => s.toast);
  const banner = useFeedbackStore((s) => s.banner);
  const setBanner = useFeedbackStore((s) => s.setBanner);
  const sheetHosts = useFeedbackStore((s) => s.sheetHosts);
  const registerSheetHost = useFeedbackStore((s) => s.registerSheetHost);
  const unregisterSheetHost = useFeedbackStore((s) => s.unregisterSheetHost);

  useEffect(() => {
    if (host !== 'sheet') return;
    registerSheetHost();
    return () => unregisterSheetHost();
  }, [host, registerSheetHost, unregisterSheetHost]);

  if (host === 'root' && sheetHosts > 0) return null;

  return (
    <Box pointerEvents="box-none" style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}>
      {banner ? (
        <Banner
          testID="app.banner"
          variant={banner.variant}
          title={banner.title}
          description={banner.description}
          {...(banner.ctaLabel
            ? { ctaLabel: banner.ctaLabel, onPressCta: () => setBanner(null) }
            : {})}
        />
      ) : null}
      {toast ? (
        <Box pointerEvents="none" pt="sm" align="center">
          <Toast testID="app.toast" message={toast} />
        </Box>
      ) : null}
    </Box>
  );
}
