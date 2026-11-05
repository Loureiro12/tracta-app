import type { ExpoConfig } from 'expo/config';

const APP_ID = 'com.tracta.mobile';

/** Google sends the OAuth response to the reversed client id, so the app must own that scheme. */
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_HEALTH_IOS_CLIENT_ID;
const googleScheme = googleClientId?.split('.').reverse().join('.');

const config: ExpoConfig = {
  name: 'Tracta',
  slug: 'tracta',
  version: '0.1.0',
  scheme: googleScheme ? ['tracta', googleScheme] : 'tracta',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: APP_ID,
    supportsTablet: false,
    // Only HTTPS/TLS from the OS: answers App Store Connect's export-compliance question up front.
    config: { usesNonExemptEncryption: false },
    // Runs keep recording GPS with the screen locked.
    infoPlist: { UIBackgroundModes: ['location'] },
  },
  locales: { 'pt-BR': './locales/pt-BR.json', en: './locales/en.json' },
  android: {
    package: APP_ID,
    adaptiveIcon: {
      backgroundColor: '#1A1A17',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_DISTANCE',
      'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_RESTING_HEART_RATE',
      'android.permission.health.READ_SLEEP',
      'android.permission.health.READ_EXERCISE',
      'android.permission.health.READ_WEIGHT',
      'android.permission.health.WRITE_EXERCISE',
      'android.permission.health.WRITE_DISTANCE',
      'android.permission.health.WRITE_WEIGHT',
    ],
    // Without a key the run map falls back to the drawn route (see features/run).
    config: { googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY ?? '' } },
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
        // Health Connect needs Android 8+ and SDK 36 headers.
        android: { compileSdkVersion: 36, targetSdkVersion: 36, minSdkVersion: 26 },
      },
    ],
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'Tracta reads steps, distance, energy, heart rate, sleep, workouts, weight and waist to show your day and your history.',
        NSHealthUpdateUsageDescription:
          'Tracta saves the workouts, runs and weigh-ins you record so they appear in Apple Health.',
        background: false,
      },
    ],
    'react-native-health-connect',
    [
      'expo-location',
      {
        locationWhenInUsePermission: 'Tracta uses your location to map and measure your runs.',
        locationAlwaysAndWhenInUsePermission:
          'Tracta keeps measuring your run while the screen is locked.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Tracta lets you pick progress photos from your library.',
        cameraPermission: 'Tracta uses the camera to take progress photos.',
      },
    ],
    'expo-sharing',
    // Local notifications only (rest timer ending); no push.
    'expo-notifications',
  ],
  experiments: { typedRoutes: true },
  owner: 'loureiro_12',
  extra: { eas: { projectId: '22dcfc6b-b81e-4328-b02f-a96334353962' } },
};

export default config;
