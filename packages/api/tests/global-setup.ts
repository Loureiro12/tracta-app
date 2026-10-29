import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    supabaseUrl: string;
    anonKey: string;
    serviceRoleKey: string;
  }
}

type Status = { API_URL: string; ANON_KEY: string; SERVICE_ROLE_KEY: string };

/**
 * Resolves the local Supabase endpoint once per run. CI can also pass SUPABASE_URL,
 * SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY explicitly.
 */
export default function setup(project: TestProject) {
  let status: Status;
  if (
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    status = {
      API_URL: process.env.SUPABASE_URL,
      ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  } else {
    try {
      const out = execFileSync('supabase', ['status', '-o', 'json'], {
        cwd: resolve(import.meta.dirname, '../../..'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
      status = JSON.parse(out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1)) as Status;
    } catch {
      throw new Error(
        'Local Supabase is not running. Start it with `supabase start` from the repo root.',
      );
    }
  }
  project.provide('supabaseUrl', status.API_URL);
  project.provide('anonKey', status.ANON_KEY);
  project.provide('serviceRoleKey', status.SERVICE_ROLE_KEY);
}
