-- =============================================================================
-- E-mail invites demo data: the demo user invited marina@example.com, who has not signed up yet
-- (hub "Invites sent" → "waiting for sign-up"; the revoke flow cancels it).
-- =============================================================================

create or replace function seed.demo_45_email_invites() returns void language plpgsql as $$
begin
  insert into public.email_invites (inviter_id, email, created_at, last_sent_at)
  values (seed.demo_user(), 'marina@example.com', now() - interval '2 days', now() - interval '2 days')
  on conflict (inviter_id, email) do nothing;
end;
$$;
