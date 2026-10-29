/** Program catalog, enrollment and the race goal. */
import { z } from 'zod';

import { ApiError, toApiError, unwrap, unwrapOne } from '../errors';

import type { TractaClient } from '../client';
import type { Database } from '../database.types';

type ProgramRow = Database['public']['Tables']['programs']['Row'];
type RaceRow = Database['public']['Tables']['races']['Row'];

export type Program = {
  id: string;
  name: string;
  weeks: number;
  /** "Musculação · intermediário" */
  tag: string;
  /** "3 treinos/semana" */
  frequency: string;
  description: string;
  /** Mon..Sun tokens: routine letter, 'F' full body, '⟶' run, '—' rest. */
  pattern: string[];
  legend: string;
  weekTitles: string[];
  /** 0-based deload weeks. */
  lightWeeks: number[];
};

export type Enrollment = {
  programId: string;
  /** YYYY-MM-DD */
  startedOn: string;
};

export type Race = {
  distanceM: number;
  /** YYYY-MM-DD */
  raceDate: string;
  targetSeconds: number;
  updatedAt: string;
};

async function requireUserId(client: TractaClient): Promise<string> {
  const { data } = await client.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new ApiError('not_authenticated', 'Not signed in');
  return id;
}

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) throw new ApiError('validation', parsed.error.message, parsed.error);
  return parsed.data;
}

function toProgram(r: ProgramRow): Program {
  return {
    id: r.id,
    name: r.name,
    weeks: r.weeks,
    tag: r.tag,
    frequency: r.frequency,
    description: r.description,
    pattern: r.pattern,
    legend: r.legend,
    weekTitles: r.week_titles,
    lightWeeks: r.light_weeks,
  };
}

function toRace(r: RaceRow): Race {
  return {
    distanceM: r.distance_m,
    raceDate: r.race_date,
    targetSeconds: r.target_seconds,
    updatedAt: r.updated_at,
  };
}

const dateKey = z.iso.date();
const programId = z.string().regex(/^[a-z0-9-]+$/);

/** Program catalog in display order. */
export async function listPrograms(client: TractaClient): Promise<Program[]> {
  await requireUserId(client);
  const rows = unwrap(await client.from('programs').select('*').order('position')) ?? [];
  return rows.map(toProgram);
}

export async function getProgram(client: TractaClient, id: string): Promise<Program> {
  await requireUserId(client);
  const pid = parse(programId, id);
  return toProgram(
    unwrapOne(await client.from('programs').select('*').eq('id', pid).maybeSingle(), 'program'),
  );
}

/** The user's active program, or null. */
export async function getEnrollment(client: TractaClient): Promise<Enrollment | null> {
  const me = await requireUserId(client);
  const row = unwrap(
    await client
      .from('program_enrollments')
      .select('program_id, started_on')
      .eq('user_id', me)
      .maybeSingle(),
  );
  return row ? { programId: row.program_id, startedOn: row.started_on } : null;
}

/** Starts (or switches to) a program; `startedOn` (YYYY-MM-DD) defaults to today in UTC. */
export async function enroll(
  client: TractaClient,
  input: { programId: string; startedOn?: string },
): Promise<Enrollment> {
  const me = await requireUserId(client);
  const data = parse(z.object({ programId, startedOn: dateKey.optional() }), input);
  const { data: exists, error } = await client
    .from('programs')
    .select('id')
    .eq('id', data.programId)
    .maybeSingle();
  if (error) throw toApiError(error);
  if (!exists) throw new ApiError('not_found', 'program not found');
  const row = unwrapOne(
    await client
      .from('program_enrollments')
      .upsert({
        user_id: me,
        program_id: data.programId,
        // Switching programs restarts the count, so the start date is always written.
        started_on: data.startedOn ?? new Date().toISOString().slice(0, 10),
      })
      .select('program_id, started_on')
      .maybeSingle(),
    'enrollment',
  );
  return { programId: row.program_id, startedOn: row.started_on };
}

/** Ends the active program (no-op when there is none). */
export async function endEnrollment(client: TractaClient): Promise<void> {
  const me = await requireUserId(client);
  unwrap(await client.from('program_enrollments').delete().eq('user_id', me));
}

/** 1-based current week of an enrollment on `today` (YYYY-MM-DD), clamped to the program. */
export function currentWeek(enrollment: Enrollment, program: Program, today: string): number {
  const ms = Date.parse(`${today}T00:00:00Z`) - Date.parse(`${enrollment.startedOn}T00:00:00Z`);
  const week = Math.floor(ms / (7 * 86_400_000)) + 1;
  return Math.min(program.weeks, Math.max(1, week));
}

// -----------------------------------------------------------------------------
// Race goal ("Minha prova")
// -----------------------------------------------------------------------------

export async function getRace(client: TractaClient): Promise<Race | null> {
  const me = await requireUserId(client);
  const row = unwrap(await client.from('races').select('*').eq('user_id', me).maybeSingle());
  return row ? toRace(row) : null;
}

export const raceInput = z.object({
  distanceM: z.number().int().min(1000).max(100000),
  raceDate: dateKey,
  targetSeconds: z.number().int().min(600).max(86400),
});

export type RaceInput = z.input<typeof raceInput>;

/** Sets or replaces the user's target race. */
export async function saveRace(client: TractaClient, input: RaceInput): Promise<Race> {
  const me = await requireUserId(client);
  const data = parse(raceInput, input);
  return toRace(
    unwrapOne(
      await client
        .from('races')
        .upsert({
          user_id: me,
          distance_m: data.distanceM,
          race_date: data.raceDate,
          target_seconds: data.targetSeconds,
        })
        .select('*')
        .maybeSingle(),
      'race',
    ),
  );
}

export async function deleteRace(client: TractaClient): Promise<void> {
  const me = await requireUserId(client);
  unwrap(await client.from('races').delete().eq('user_id', me));
}
