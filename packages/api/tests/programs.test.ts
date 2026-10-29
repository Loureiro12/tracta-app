import { describe, expect, it } from 'vitest';

import { programs } from '../src';
import { anonClient, createTestUser } from './helpers';

describe('programs', () => {
  it('requires a session', async () => {
    await expect(programs.listPrograms(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
    await expect(programs.getRace(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('lists the catalog in order', async () => {
    const { client } = await createTestUser('Reader');
    const list = await programs.listPrograms(client);
    expect(list.map((p) => p.id)).toEqual(['forca', '5k', 'volta']);
    expect(list[0]).toMatchObject({
      name: 'Força em 8 semanas',
      weeks: 8,
      pattern: ['A', '—', 'B', '—', 'C', '—', '—'],
      lightWeeks: [3, 7],
    });
    expect(list[0]?.weekTitles).toHaveLength(8);
    expect(await programs.getProgram(client, '5k')).toMatchObject({ weeks: 6 });
    await expect(programs.getProgram(client, 'nope')).rejects.toMatchObject({ code: 'not_found' });
    await expect(programs.getProgram(client, 'Bad Id')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('enrolls, switches and ends a program, per user', async () => {
    const a = await createTestUser('Enrolled');
    const b = await createTestUser('Bystander');
    expect(await programs.getEnrollment(a.client)).toBeNull();

    expect(
      await programs.enroll(a.client, { programId: 'forca', startedOn: '2026-10-12' }),
    ).toEqual({ programId: 'forca', startedOn: '2026-10-12' });
    // Switching restarts the count.
    expect(await programs.enroll(a.client, { programId: '5k', startedOn: '2026-10-26' })).toEqual({
      programId: '5k',
      startedOn: '2026-10-26',
    });
    expect(await programs.getEnrollment(a.client)).toEqual({
      programId: '5k',
      startedOn: '2026-10-26',
    });
    expect(await programs.getEnrollment(b.client)).toBeNull();

    await expect(programs.enroll(a.client, { programId: 'nope' })).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(
      programs.enroll(a.client, { programId: 'forca', startedOn: '26/10/2026' }),
    ).rejects.toMatchObject({ code: 'validation' });

    // Ending someone else's enrollment is impossible: b's call only touches b.
    await programs.endEnrollment(b.client);
    expect(await programs.getEnrollment(a.client)).not.toBeNull();
    await programs.endEnrollment(a.client);
    expect(await programs.getEnrollment(a.client)).toBeNull();
  });

  it('computes the current week', () => {
    const program = {
      id: 'forca',
      name: '',
      weeks: 8,
      tag: '',
      frequency: '',
      description: '',
      pattern: [],
      legend: '',
      weekTitles: [],
      lightWeeks: [],
    };
    const e = { programId: 'forca', startedOn: '2026-10-12' };
    expect(programs.currentWeek(e, program, '2026-10-12')).toBe(1);
    expect(programs.currentWeek(e, program, '2026-10-18')).toBe(1);
    expect(programs.currentWeek(e, program, '2026-10-26')).toBe(3);
    expect(programs.currentWeek(e, program, '2027-06-01')).toBe(8);
    expect(programs.currentWeek(e, program, '2026-10-01')).toBe(1);
  });

  it('sets, replaces and removes the race goal, per user', async () => {
    const a = await createTestUser('Runner');
    const b = await createTestUser('Couch');
    expect(await programs.getRace(a.client)).toBeNull();

    const race = await programs.saveRace(a.client, {
      distanceM: 21098,
      raceDate: '2026-12-07',
      targetSeconds: 6960,
    });
    expect(race).toMatchObject({ distanceM: 21098, raceDate: '2026-12-07', targetSeconds: 6960 });
    const replaced = await programs.saveRace(a.client, {
      distanceM: 10000,
      raceDate: '2026-12-14',
      targetSeconds: 3300,
    });
    expect(replaced).toMatchObject({ distanceM: 10000, raceDate: '2026-12-14' });
    expect(await programs.getRace(b.client)).toBeNull();

    await expect(
      programs.saveRace(a.client, { distanceM: 500, raceDate: '2026-12-14', targetSeconds: 3300 }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      programs.saveRace(a.client, { distanceM: 5000, raceDate: 'soon', targetSeconds: 3300 }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      programs.saveRace(a.client, { distanceM: 5000, raceDate: '2026-12-14', targetSeconds: 60 }),
    ).rejects.toMatchObject({ code: 'validation' });

    await programs.deleteRace(b.client);
    expect(await programs.getRace(a.client)).not.toBeNull();
    await programs.deleteRace(a.client);
    expect(await programs.getRace(a.client)).toBeNull();
  });
});
