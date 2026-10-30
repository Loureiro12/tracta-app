-- =============================================================================
-- GPS tracks for the demo account's runs (History › session detail draws them on the map).
-- activities.route is a Google encoded polyline (precision 5), the same format the app writes
-- through packages/api (src/polyline.ts). Each run gets a closed loop around Ibirapuera park
-- whose length matches its distance; the loop is the prototype's ROUTE shape.
-- =============================================================================

-- One zig-zag + base64-ish chunked value of the polyline algorithm.
create or replace function seed.polyline_value(p_value bigint)
returns text
language plpgsql
immutable
as $$
declare
  n bigint := case when p_value < 0 then ~(p_value << 1) else p_value << 1 end;
  encoded text := '';
begin
  while n >= 32 loop
    encoded := encoded || chr(((n & 31) | 32)::int + 63);
    n := n >> 5;
  end loop;
  return encoded || chr(n::int + 63);
end;
$$;

-- Encodes [[lat, lng], …] (degrees) as a polyline.
create or replace function seed.polyline(p_points double precision[])
returns text
language plpgsql
immutable
as $$
declare
  prev_lat bigint := 0;
  prev_lng bigint := 0;
  lat bigint;
  lng bigint;
  encoded text := '';
begin
  for i in 1 .. coalesce(array_length(p_points, 1), 0) loop
    lat := round(p_points[i][1] * 1e5);
    lng := round(p_points[i][2] * 1e5);
    encoded := encoded || seed.polyline_value(lat - prev_lat) || seed.polyline_value(lng - prev_lng);
    prev_lat := lat;
    prev_lng := lng;
  end loop;
  return encoded;
end;
$$;

-- A closed loop of about p_meters around Ibirapuera, rotated by p_turn radians.
create or replace function seed.route_loop(p_meters integer, p_turn double precision default 0)
returns text
language plpgsql
immutable
as $$
declare
  lat0 constant double precision := -23.5874;
  lng0 constant double precision := -46.6576;
  m_per_deg constant double precision := 111320;
  n integer := greatest(40, p_meters / 25);
  perimeter double precision := 0;
  scale double precision;
  t double precision;
  x double precision;
  y double precision;
  px double precision;
  py double precision;
  points double precision[] := '{}';
begin
  -- Perimeter of the unit shape (x east, y north).
  for i in 0 .. 400 loop
    t := i / 400.0 * 2 * pi() - pi() / 2;
    x := 118 * cos(t) + 26 * cos(3 * t);
    y := -(74 * sin(t) + 16 * sin(2 * t));
    if i > 0 then perimeter := perimeter + sqrt((x - px) ^ 2 + (y - py) ^ 2); end if;
    px := x;
    py := y;
  end loop;
  scale := p_meters / perimeter;
  for i in 0 .. n loop
    t := i::double precision / n * 2 * pi() - pi() / 2;
    x := (118 * cos(t) + 26 * cos(3 * t)) * scale;
    y := -(74 * sin(t) + 16 * sin(2 * t)) * scale;
    px := x * cos(p_turn) - y * sin(p_turn);
    py := x * sin(p_turn) + y * cos(p_turn);
    points := points || array[[lat0 + py / m_per_deg, lng0 + px / (m_per_deg * cos(radians(lat0)))]];
  end loop;
  return seed.polyline(points);
end;
$$;

create or replace function seed.demo_36_run_routes() returns void language plpgsql as $$
begin
  update public.activities
    set route = seed.route_loop(distance_m, extract(doy from started_at)::double precision * 0.37)
    where owner_id = seed.demo_user() and gps and distance_m > 0 and route is null;
end;
$$;
