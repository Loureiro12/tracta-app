-- Apple's refresh token for each account that signed in with Apple. Deleting the account must
-- revoke the app's access at Apple (App Store Review Guideline 5.1.1(v)), which needs this token.
-- Only the apple-account Edge Function (service role) reads or writes it: no client access.
create table public.apple_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);
alter table public.apple_tokens enable row level security;
revoke all on public.apple_tokens from anon, authenticated;
