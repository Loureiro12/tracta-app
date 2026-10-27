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
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: ['expo-router'],
  experiments: { typedRoutes: true },
};

export default config;
