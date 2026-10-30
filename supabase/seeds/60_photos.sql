-- =============================================================================
-- Demo progress photos of lucas@tracta.app (Perfil › Fotos de progresso).
-- Only the metadata rows are seeded: SQL cannot put bytes into Storage, so these frames have no
-- object and the app draws its placeholder frame (as in the design handoff). Photos added by
-- the user (or by the E2E fake picker) are real objects under `<user_id>/` in `progress-photos`;
-- seed.reset_demo() removes them together with the rows.
-- Weights match the scale weigh-ins on the same days where there is one (30_logging).
-- =============================================================================

create or replace function seed.demo_60_photos()
returns void
language plpgsql
as $$
begin
  insert into public.progress_photos (id, owner_id, taken_on, weight_kg, storage_path, created_at) values
  ('00000000-0000-4000-b000-0000000000f1', seed.demo_user(), '2026-09-27', 79.8, seed.demo_user() || '/seed-2026-09-27.jpg', '2026-09-27 08:00-03'),
  ('00000000-0000-4000-b000-0000000000f2', seed.demo_user(), '2026-08-31', 80.9, seed.demo_user() || '/seed-2026-08-31.jpg', '2026-08-31 08:00-03'),
  ('00000000-0000-4000-b000-0000000000f3', seed.demo_user(), '2026-07-27', 81.8, seed.demo_user() || '/seed-2026-07-27.jpg', '2026-07-27 08:00-03'),
  ('00000000-0000-4000-b000-0000000000f4', seed.demo_user(), '2026-06-29', 82.6, seed.demo_user() || '/seed-2026-06-29.jpg', '2026-06-29 08:00-03'),
  ('00000000-0000-4000-b000-0000000000f5', seed.demo_user(), '2026-06-01', 83.5, seed.demo_user() || '/seed-2026-06-01.jpg', '2026-06-01 08:00-03');
end;
$$;
