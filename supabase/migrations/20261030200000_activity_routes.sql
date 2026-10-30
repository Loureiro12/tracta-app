-- =============================================================================
-- Activity routes: the GPS track recorded by the app, saved with the activity.
--   * activities.route: Google encoded polyline (precision 5 ≈ 1 m), latitude/longitude only.
--     Timing is not part of the track: per-km splits are stored in activities.splits. The app
--     records points locally while the activity runs and only sends the track when it is saved.
--   * Only GPS activities carry a route.
-- =============================================================================

alter table public.activities
  add column route text,
  add constraint activities_route_format check (
    route is null or (char_length(route) between 2 and 200000 and route ~ '^[?-~]+$')
  ),
  add constraint activities_route_needs_gps check (route is null or gps);

comment on column public.activities.route is
  'GPS track as a Google encoded polyline (precision 5, lat/lng). Null without GPS.';
