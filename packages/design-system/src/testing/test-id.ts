/**
 * Test IDs are the contract between the UI and the E2E suite.
 *
 * Format: `<domain>.<screen-or-component>.<element>[.<qualifier>]`
 *   - domain: feature name (kebab-case) or `ds` for design-system components
 *   - all segments lower-case, kebab-case, separated by dots
 *
 * Examples: `home.screen`, `home.cta.primary`, `ds.button.primary`
 */
export type TestId = `${string}.${string}`;

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Builds a dotted test ID and validates each segment in development. */
export function testId(...segments: readonly string[]): TestId {
  if (__DEV__) {
    for (const segment of segments) {
      if (!SEGMENT.test(segment)) {
        throw new Error(`Invalid testID segment "${segment}". Use lower-case kebab-case.`);
      }
    }
    if (segments.length < 2) {
      throw new Error('A testID needs at least two segments: <domain>.<element>.');
    }
  }
  return segments.join('.') as TestId;
}

/** Props shared by every component that can be targeted by an E2E flow. */
export type Testable = {
  /** Required: every interactive or asserted element must be addressable from Maestro. */
  testID: string;
};

/** Same as Testable but optional, for purely structural elements (Box, Stack). */
export type MaybeTestable = { testID?: string | undefined };
