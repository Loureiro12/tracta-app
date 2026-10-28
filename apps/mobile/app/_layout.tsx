import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AppChrome } from '@/app-providers/AppChrome';
import { AppProviders } from '@/app-providers/AppProviders';

/**
 * Single root navigator. Route groups are path organisation only (no nested navigators), so
 * every overlay and sheet is a direct child of this stack: safe areas, `router.back()` and deep
 * links behave uniformly.
 *  (tabs)      the 5 tabs (Início · Saúde · Treinos · Histórico · Perfil)
 *  (auth)      welcome / login / signup / connections (fade)
 *  (overlays)  full-screen overlays that slide in from the right ("‹ Voltar")
 *  (sheets)    bottom sheets: transparent modal over the previous screen
 */
export const unstable_settings = {
  // Deep links into an overlay or sheet get the tabs underneath, so "back" always has a target.
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <Stack
        screenLayout={({ route, children }) =>
          route.name.startsWith('(sheets)') ? (
            <>
              {children}
              <AppChrome host="sheet" />
            </>
          ) : (
            <>{children}</>
          )
        }
        screenOptions={({ route }) => {
          if (route.name.startsWith('(sheets)')) {
            return {
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'slide_from_bottom',
              contentStyle: { backgroundColor: 'transparent' },
            };
          }
          if (route.name.startsWith('(auth)')) {
            return { headerShown: false, animation: 'fade' };
          }
          return { headerShown: false, animation: 'slide_from_right' };
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
      <AppChrome />
    </AppProviders>
  );
}
