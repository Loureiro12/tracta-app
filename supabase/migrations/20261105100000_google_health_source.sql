-- Google Health as a Health source: on iOS the app reads it through the Google Health API and
-- syncs the same daily aggregates as Apple Health and Health Connect.

alter table public.health_connections drop constraint health_connections_source_check;
alter table public.health_connections add constraint health_connections_source_check
  check (source in ('apple_health', 'health_connect', 'google_health'));

alter table public.health_days drop constraint health_days_source_check;
alter table public.health_days add constraint health_days_source_check
  check (source in ('apple_health', 'health_connect', 'google_health'));
