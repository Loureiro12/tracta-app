/**
 * Google encoded polyline (precision 5 ≈ 1 m): the storage format of `activities.route`.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

/** [latitude, longitude] in degrees. */
export type LatLng = [number, number];

const FACTOR = 1e5;

function encodeValue(value: number): string {
  let n = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (n >= 0x20) {
    out += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
    n >>>= 5;
  }
  return out + String.fromCharCode(n + 63);
}

export function encodePolyline(points: readonly LatLng[]): string {
  let lat = 0;
  let lng = 0;
  let out = '';
  for (const [la, ln] of points) {
    const nextLat = Math.round(la * FACTOR);
    const nextLng = Math.round(ln * FACTOR);
    out += encodeValue(nextLat - lat) + encodeValue(nextLng - lng);
    lat = nextLat;
    lng = nextLng;
  }
  return out;
}

/** Decodes a polyline; returns [] when the string is malformed. */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  const next = (): number | null => {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      if (index >= encoded.length) return null;
      byte = encoded.charCodeAt(index++) - 63;
      if (byte < 0 || byte > 0x3f) return null;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    const dLat = next();
    const dLng = next();
    if (dLat === null || dLng === null) return [];
    lat += dLat;
    lng += dLng;
    points.push([lat / FACTOR, lng / FACTOR]);
  }
  return points;
}
