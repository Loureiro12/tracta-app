/** `<listTestID>.<key>` for items of a list whose container carries the prefix testID. */
export function itemId(prefix: string, key: string | number): string {
  return `${prefix}.${key}`;
}
