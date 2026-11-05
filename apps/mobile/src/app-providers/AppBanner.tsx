import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';

/**
 * Status strip above the navigator: it pushes the screens down rather than covering their headers.
 * The navigator has its own SafeAreaProvider (app/_layout.tsx), so screens stop reserving the
 * status bar while the strip is covering it. This one reads the window's insets.
 */
export function AppBanner() {
  const insets = useSafeAreaInsets();
  const banner = useFeedbackStore((s) => s.banner);
  const setBanner = useFeedbackStore((s) => s.setBanner);
  if (!banner) return null;
  return (
    <Banner
      testID="app.banner"
      variant={banner.variant}
      title={banner.title}
      description={banner.description}
      safeTop={insets.top}
      {...(banner.ctaLabel
        ? { ctaLabel: banner.ctaLabel, onPressCta: banner.onPressCta ?? (() => setBanner(null)) }
        : {})}
    />
  );
}
