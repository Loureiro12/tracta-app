/** Formatting helpers for mock history values (ports of the prototype's `clock`, `fkm`, `hm`, `kg`). */

/** Seconds → "m:ss" or "h:mm:ss". */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const x = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(x).padStart(2, '0')}`;
}

/** Minutes → "7h 05". */
export function hoursMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}`;
}

/** Decimal with a comma, as the prototype renders distances and loads (data, not copy). */
export function decimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

/** Kilometres with two decimals: 8.2 → "8,20". */
export function km2(value: number): string {
  return decimal(value, 2);
}

/** Load in kg without trailing zeros: 57.5 → "57,5", 60 → "60". */
export function kg(value: number): string {
  return String(value).replace('.', ',');
}

/** "18:40" from minutes since midnight. */
export function timeOfDay(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Thousands separator with a dot (pt-BR style, as in the prototype). */
export function thousands(value: number): string {
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Signed value: "+2,5" / "−0:48". */
export function signed(value: number, formatted: string): string {
  return `${value >= 0 ? '+' : '−'}${formatted}`;
}
