import type { ExpoConfig } from 'expo/config';

const APP_ID = 'com.tracta.mobile';

const config: ExpoConfig = {
  name: 'Tracta',
  slug: 'tracta',
  version: '0.1.0',
  scheme: 'tracta',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
  },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#F2EEE6',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    'expo-router',
    [
      'expo-font',
      {
        // Archivo static instances (OFL). Embedded natively so the first frame is already in the brand font.
        fonts: [
          './assets/fonts/Archivo100-Regular.ttf',
          './assets/fonts/Archivo100-Medium.ttf',
          './assets/fonts/Archivo100-SemiBold.ttf',
          './assets/fonts/Archivo100-Bold.ttf',
          './assets/fonts/Archivo100-ExtraBold.ttf',
          './assets/fonts/Archivo80-Bold.ttf',
          './assets/fonts/Archivo75-Bold.ttf',
          './assets/fonts/Archivo75-ExtraBold.ttf',
          './assets/fonts/Archivo70-Bold.ttf',
          './assets/fonts/Archivo70-ExtraBold.ttf',
          './assets/fonts/Archivo112-ExtraBold.ttf',
        ],
      },
    ],
    ['expo-localization', { supportedLocales: ['en', 'pt-BR'] }],
    [
      'expo-build-properties',
      {
        // SDK 58 ships prebuilt Expo module xcframeworks. The published ExpoModulesCore binary
        // is missing a symbol that ExpoFileSystem (built from source) references, which crashes
        // Release builds at launch with "Symbol not found: ...EventEmitter...eventRuntime".
        // Building the Expo modules from source avoids the mismatch. Re-evaluate on SDK upgrades.
        ios: { usePrecompiledModules: false },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
