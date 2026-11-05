import { Platform } from 'react-native';

import {
  AppleAuthenticationScope,
  formatFullName,
  isAvailableAsync,
  signInAsync,
} from 'expo-apple-authentication';
import { AuthRequest, ResponseType, exchangeCodeAsync } from 'expo-auth-session';
import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

import { auth, supabase } from '@/shared/api';
import { env } from '@/shared/config/env';

import { DEMO_ACCOUNT } from '../model/auth.mock';

import type { SocialProvider } from '../model/auth.mock';
import type { AuthUser } from '@tracta/api';

export type SocialResult = (AuthUser & { isNew: boolean }) | null;

const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

/** The provider gets the SHA-256 of the nonce and Supabase the raw one, so a token can't be replayed. */
async function newNonce(): Promise<{ raw: string; hashed: string }> {
  const raw = randomUUID();
  return { raw, hashed: await digestStringAsync(CryptoDigestAlgorithm.SHA256, raw) };
}

/**
 * Providers this device can offer. Apple only on iOS (Android would need the web flow and a key
 * rotated every 6 months); Google only where an OAuth client is set up (iOS for now).
 */
export async function availableProviders(): Promise<SocialProvider[]> {
  if (env.isE2E) return ['Apple', 'Google'];
  const providers: SocialProvider[] = [];
  if (Platform.OS === 'ios' && (await isAvailableAsync().catch(() => false))) {
    providers.push('Apple');
  }
  if (Platform.OS === 'ios' && env.googleHealthIosClientId) providers.push('Google');
  return providers;
}

function isCancel(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED';
}

async function withApple(): Promise<SocialResult> {
  const nonce = await newNonce();
  let credential;
  try {
    credential = await signInAsync({
      requestedScopes: [AppleAuthenticationScope.FULL_NAME, AppleAuthenticationScope.EMAIL],
      nonce: nonce.hashed,
    });
  } catch (error) {
    if (isCancel(error)) return null;
    throw error;
  }
  if (!credential.identityToken) return null;
  const name = credential.fullName ? formatFullName(credential.fullName).trim() : '';
  const user = await auth.signInWithIdToken(supabase, {
    provider: 'apple',
    token: credential.identityToken,
    nonce: nonce.raw,
    ...(name ? { name } : {}),
  });
  // Lets account deletion revoke the app's access at Apple, as the App Store requires.
  if (credential.authorizationCode) {
    void auth.linkAppleAccount(supabase, credential.authorizationCode).catch(() => undefined);
  }
  return user;
}

async function withGoogle(): Promise<SocialResult> {
  const clientId = env.googleHealthIosClientId;
  if (!clientId) throw new Error('EXPO_PUBLIC_GOOGLE_HEALTH_IOS_CLIENT_ID is not set');
  // The app owns the reversed client id as a URL scheme (app.config.ts).
  const redirectUri = `${clientId.split('.').reverse().join('.')}:/oauthredirect`;
  const nonce = await newNonce();
  const request = new AuthRequest({
    clientId,
    redirectUri,
    responseType: ResponseType.Code,
    scopes: ['openid', 'email', 'profile'],
    usePKCE: true,
    extraParams: { nonce: nonce.hashed },
  });
  const result = await request.promptAsync(googleDiscovery);
  if (result.type !== 'success' || !result.params.code) return null;
  const tokens = await exchangeCodeAsync(
    {
      clientId,
      redirectUri,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    googleDiscovery,
  );
  if (!tokens.idToken) throw new Error('Google returned no ID token');
  return auth.signInWithIdToken(supabase, {
    provider: 'google',
    token: tokens.idToken,
    nonce: nonce.raw,
  });
}

/**
 * Signs in (or up) with Apple or Google. Resolves null when the user backs out. E2E builds can't
 * drive the providers' sheets, so they sign in to the demo account instead, restored first like
 * the E2E sign-in route does (another flow may have changed its password).
 */
export async function signInWithProvider(provider: SocialProvider): Promise<SocialResult> {
  if (env.isE2E) {
    const { error } = await supabase.rpc('e2e_reset_demo');
    if (error) throw error;
    return { ...(await auth.signIn(supabase, DEMO_ACCOUNT)), isNew: false };
  }
  return provider === 'Apple' ? withApple() : withGoogle();
}
