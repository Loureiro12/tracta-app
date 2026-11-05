// Edge function: keep and revoke the app's access at Apple for accounts that sign in with Apple.
//
// POST { action: 'link', code: string } with the caller's access token: exchanges the one-time
//   authorization code from the device for a refresh token and keeps it (public.apple_tokens).
// POST { action: 'revoke' }: revokes that token at Apple and forgets it. Called right before the
//   account is deleted, as App Store Review Guideline 5.1.1(v) requires.
// Both answer 200 { ok: true, skipped?: true }: skipped when Apple isn't set up (local stack) or the
// account never signed in with Apple. Errors: 400/401/502 { code, message }.
//
// Secrets: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY (the .p8 contents) and APPLE_CLIENT_ID
// (the iOS bundle id, com.tracta.mobile).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { SignJWT, importPKCS8 } from 'npm:jose@5.9.6';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const TEAM_ID = Deno.env.get('APPLE_TEAM_ID') ?? '';
const KEY_ID = Deno.env.get('APPLE_KEY_ID') ?? '';
const PRIVATE_KEY = (Deno.env.get('APPLE_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n');
const CLIENT_ID = Deno.env.get('APPLE_CLIENT_ID') ?? 'com.tracta.mobile';

const APPLE = 'https://appleid.apple.com';

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fail = (status: number, code: string, message: string) => json(status, { code, message });

/** Apple's client secret: a short-lived JWT signed with the Sign in with Apple key. */
async function clientSecret(): Promise<string> {
  const key = await importPKCS8(PRIVATE_KEY, 'ES256');
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: KEY_ID })
    .setIssuer(TEAM_ID)
    .setIssuedAt()
    .setExpirationTime('5m')
    .setAudience(APPLE)
    .setSubject(CLIENT_ID)
    .sign(key);
}

async function apple(path: string, params: Record<string, string>): Promise<Response> {
  return fetch(`${APPLE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: await clientSecret(),
      ...params,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return fail(405, 'validation', 'Use POST');

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData } = token ? await admin.auth.getUser(token) : { data: null };
  const caller = userData?.user;
  if (!caller) return fail(401, 'not_authenticated', 'Not signed in');

  let body: { action?: unknown; code?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, 'validation', 'Body must be JSON');
  }

  const configured = Boolean(TEAM_ID && KEY_ID && PRIVATE_KEY);

  if (body.action === 'link') {
    if (typeof body.code !== 'string' || !body.code) return fail(400, 'validation', 'Missing code');
    if (!configured) return json(200, { ok: true, skipped: true });
    const response = await apple('/auth/token', {
      grant_type: 'authorization_code',
      code: body.code,
    });
    const tokens = (await response.json().catch(() => null)) as { refresh_token?: string } | null;
    if (!response.ok || !tokens?.refresh_token) {
      console.error('Apple token exchange failed', response.status, tokens);
      return fail(502, 'network', 'Apple did not accept the authorization code');
    }
    const { error } = await admin.from('apple_tokens').upsert({
      user_id: caller.id,
      refresh_token: tokens.refresh_token,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('apple_tokens upsert failed', error);
      return fail(500, 'unknown', 'Could not keep the Apple token');
    }
    return json(200, { ok: true });
  }

  if (body.action === 'revoke') {
    const { data: row } = await admin
      .from('apple_tokens')
      .select('refresh_token')
      .eq('user_id', caller.id)
      .maybeSingle();
    if (!row) return json(200, { ok: true, skipped: true });
    if (!configured) return json(200, { ok: true, skipped: true });
    const response = await apple('/auth/revoke', {
      token: row.refresh_token,
      token_type_hint: 'refresh_token',
    });
    if (!response.ok) {
      console.error('Apple revoke failed', response.status, await response.text().catch(() => ''));
      return fail(502, 'network', 'Apple did not revoke the access');
    }
    await admin.from('apple_tokens').delete().eq('user_id', caller.id);
    return json(200, { ok: true });
  }

  return fail(400, 'validation', 'Unknown action');
});
