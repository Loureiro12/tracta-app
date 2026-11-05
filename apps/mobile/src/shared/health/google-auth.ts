import {
  AuthRequest,
  ResponseType,
  exchangeCodeAsync,
  refreshAsync,
  revokeAsync,
} from 'expo-auth-session';
import { deleteItemAsync, getItemAsync, setItemAsync } from 'expo-secure-store';

import { googleHealth, supabase } from '@/shared/api';
import { env } from '@/shared/config/env';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};
/** Refreshes a little before the hour is over rather than risk a request failing on it. */
const EXPIRY_MARGIN_MS = 60_000;

let access: { userId: string; token: string; expiresAt: number } | null = null;

/** The refresh token or the user's consent is gone: only signing in to Google again helps. */
export class GoogleHealthReconnectNeeded extends Error {
  constructor() {
    super('Google Health needs to be connected again');
    this.name = 'GoogleHealthReconnectNeeded';
  }
}

/** `123-abc.apps.googleusercontent.com` → `com.googleusercontent.apps.123-abc:/oauthredirect` */
function redirectUri(clientId: string): string {
  return `${clientId.split('.').reverse().join('.')}:/oauthredirect`;
}

function clientId(): string {
  const id = env.googleHealthIosClientId;
  if (!id) throw new Error('EXPO_PUBLIC_GOOGLE_HEALTH_IOS_CLIENT_ID is not set');
  return id;
}

/** Tokens belong to one Tracta account: another one on this device must never read this data. */
async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new GoogleHealthReconnectNeeded();
  return id;
}

const refreshKey = (userId: string) => `tracta.google-health.${userId}`;

/** Opens Google's consent page in the system browser. Resolves false if the user backed out. */
export async function signInToGoogleHealth(): Promise<boolean> {
  const id = clientId();
  const uri = redirectUri(id);
  const request = new AuthRequest({
    clientId: id,
    redirectUri: uri,
    responseType: ResponseType.Code,
    scopes: [...googleHealth.SCOPES],
    usePKCE: true,
    // Without these Google may answer with no refresh token on a repeat consent.
    extraParams: { access_type: 'offline', prompt: 'consent' },
  });
  const result = await request.promptAsync(discovery);
  if (result.type !== 'success' || !result.params.code) return false;

  const tokens = await exchangeCodeAsync(
    {
      clientId: id,
      redirectUri: uri,
      code: result.params.code,
      extraParams: { code_verifier: request.codeVerifier ?? '' },
    },
    discovery,
  );
  const userId = await currentUserId();
  if (tokens.refreshToken) await setItemAsync(refreshKey(userId), tokens.refreshToken);
  access = {
    userId,
    token: tokens.accessToken,
    expiresAt: Date.now() + (tokens.expiresIn ?? 3600) * 1000,
  };
  return true;
}

/** A valid access token, refreshing it when needed. */
export async function getGoogleHealthToken(forceRefresh = false): Promise<string> {
  const userId = await currentUserId();
  if (
    !forceRefresh &&
    access?.userId === userId &&
    access.expiresAt - EXPIRY_MARGIN_MS > Date.now()
  ) {
    return access.token;
  }
  const refreshToken = await getItemAsync(refreshKey(userId));
  if (!refreshToken) throw new GoogleHealthReconnectNeeded();
  try {
    const tokens = await refreshAsync({ clientId: clientId(), refreshToken }, discovery);
    access = {
      userId,
      token: tokens.accessToken,
      expiresAt: Date.now() + (tokens.expiresIn ?? 3600) * 1000,
    };
    return tokens.accessToken;
  } catch (error) {
    // Revoked, or expired (after 7 days while the Google project is in "Testing").
    if (/invalid_grant/i.test(String((error as { code?: string }).code ?? error))) {
      await deleteItemAsync(refreshKey(userId));
      access = null;
      throw new GoogleHealthReconnectNeeded();
    }
    throw error;
  }
}

/** Whether this account has Google consent stored on this device. */
export async function hasGoogleHealthToken(): Promise<boolean> {
  return Boolean(await getItemAsync(refreshKey(await currentUserId())));
}

/** Forgets the tokens and tells Google to revoke them (best effort: it may be offline). */
export async function signOutOfGoogleHealth(): Promise<void> {
  const userId = await currentUserId();
  const refreshToken = await getItemAsync(refreshKey(userId));
  await deleteItemAsync(refreshKey(userId));
  access = null;
  if (refreshToken) {
    await revokeAsync({ token: refreshToken, clientId: clientId() }, discovery).catch(
      () => undefined,
    );
  }
}
