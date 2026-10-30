// Edge function: invite a friend by e-mail.
//
// POST { email: string, locale?: 'pt-BR' | 'en' } with the caller's access token.
//   1. authenticates the caller (Authorization header → auth.getUser)
//   2. records the invite through public.create_email_invite (validation, dedupe, daily limit;
//      an address that already has an account becomes a friend request instead)
//   3. when the address has no account yet, sends the Supabase Auth invite e-mail
//      (auth.admin.inviteUserByEmail, template supabase/templates/invite.html)
// The response is the same whether or not the address has an account (no enumeration):
//   200 { ok: true } · 400/401/429 { code, message } with codes from @tracta/api ApiErrorCode.
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
// Where the e-mail button leads: the app's sign-up screen (must be in the Auth redirect allow list).
const INVITE_REDIRECT_URL = Deno.env.get('INVITE_REDIRECT_URL') ?? 'tracta://signup';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const fail = (status: number, code: string, message: string) => json(status, { code, message });

/** Postgres error from create_email_invite → HTTP status + ApiErrorCode. */
function mapDbError(error: { code?: string; message?: string }): Response {
  switch (error.code) {
    case '22023':
      return fail(400, 'validation', error.message ?? 'Invalid e-mail');
    case '42501':
      return fail(401, 'not_authenticated', 'Not signed in');
    case '53400':
      return fail(429, 'rate_limited', 'Too many invites today');
    default:
      console.error('create_email_invite failed', error);
      return fail(500, 'unknown', 'Could not record the invite');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail(405, 'validation', 'Use POST');

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(401, 'not_authenticated', 'Not signed in');
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const caller = userData?.user;
  if (userError || !caller) return fail(401, 'not_authenticated', 'Not signed in');

  let body: { email?: unknown; locale?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, 'validation', 'Body must be JSON');
  }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail(400, 'validation', 'Invalid e-mail');
  const locale = body.locale === 'en' ? 'en' : 'pt-BR';

  const { data: rows, error } = await admin.rpc('create_email_invite', {
    p_inviter: caller.id,
    p_email: email,
  });
  if (error) return mapDbError(error);
  const invite = (rows as { invite_id: string; token: string; send: boolean }[] | null)?.[0];

  if (invite?.send) {
    const { data: profile } = await admin
      .from('profiles')
      .select('name, handle')
      .eq('id', caller.id)
      .maybeSingle();
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${INVITE_REDIRECT_URL}?invite=${invite.token}`,
      data: {
        invited_by: caller.id,
        invited_by_name: profile?.name ?? '',
        invited_by_handle: profile?.handle ?? '',
        locale,
      },
    });
    // The address may already belong to a user who has not confirmed yet (invited by someone
    // else): the invite stays pending and is linked when that user signs up.
    const alreadyRegistered =
      inviteError?.code === 'email_exists' ||
      /already been registered/i.test(inviteError?.message ?? '');
    if (inviteError && !alreadyRegistered) {
      console.error('inviteUserByEmail failed', inviteError);
      // Let the user retry: an invite whose e-mail never went out is not kept.
      await admin.from('email_invites').delete().eq('id', invite.invite_id);
      return fail(502, 'network', 'Could not send the invite e-mail');
    }
  }

  return json(200, { ok: true });
});
