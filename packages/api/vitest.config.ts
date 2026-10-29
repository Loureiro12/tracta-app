import { defineConfig } from 'vitest/config';

/**
 * Integration tests run against the local Supabase stack (`supabase start`).
 * Every test creates its own users, so files run in parallel without resetting the database.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/global-setup.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
    pool: 'threads',
  },
});
