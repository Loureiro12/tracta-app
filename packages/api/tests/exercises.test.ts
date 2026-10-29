import { describe, expect, it } from 'vitest';

import { exercises, routines } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

async function libraryId(client: Parameters<typeof exercises.listExercises>[0], slug: string) {
  const list = await exercises.listExercises(client);
  const found = list.find((e) => e.slug === slug && !e.custom);
  if (!found) throw new Error(`missing ${slug}`);
  return found.id;
}

describe('exercises', () => {
  it('requires a session', async () => {
    await expect(exercises.listExercises(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('lists the built-in library in catalog order', async () => {
    const { client } = await createTestUser('Library');
    const list = await exercises.listExercises(client);
    expect(list).toHaveLength(31);
    expect(list.slice(0, 2).map((e) => e.slug)).toEqual([
      'supino-reto-com-barra',
      'supino-inclinado',
    ]);
    expect(list[0]).toMatchObject({
      name: 'Supino reto com barra',
      muscleGroup: 'Peito',
      equipment: 'Barra',
      kind: 'load_reps',
      defaultKg: 60,
      defaultReps: 8,
      defaultRestSeconds: 120,
      custom: false,
      favorite: false,
      notes: '',
    });
    expect(list.find((e) => e.slug === 'esteira')).toMatchObject({ kind: 'time', defaultKg: null });
  });

  it('creates, edits and deletes custom exercises, listed first and private', async () => {
    const a = await createTestUser('Owner');
    const b = await createTestUser('Stranger');
    const created = await exercises.createExercise(a.client, {
      name: '  Rosca no cabo ',
      muscleGroup: 'Bíceps',
      secondaryGroups: ['Ombros', 'Bíceps'],
      equipment: 'Polia',
      kind: 'load_reps',
      defaultKg: 22.5,
      defaultReps: 10,
      defaultRestSeconds: 60,
      instructions: 'Cotovelos fixos',
      favorite: true,
    });
    expect(created).toMatchObject({
      slug: 'rosca-no-cabo',
      name: 'Rosca no cabo',
      secondaryGroups: ['Ombros'],
      defaultKg: 22.5,
      custom: true,
      favorite: true,
    });

    const list = await exercises.listExercises(a.client);
    expect(list).toHaveLength(32);
    expect(list[0]?.id).toBe(created.id);
    expect(list[0]?.favorite).toBe(true);

    // Same slug again → conflict; time exercises drop load and rest.
    await expect(
      exercises.createExercise(a.client, { name: 'Rosca no cabo!', muscleGroup: 'Bíceps' }),
    ).rejects.toMatchObject({ code: 'conflict' });

    const edited = await exercises.updateExercise(a.client, created.id, {
      name: 'Rosca no cabo',
      muscleGroup: 'Bíceps',
      kind: 'time',
      defaultKg: 30,
      defaultReps: 15,
      favorite: false,
    });
    expect(edited).toMatchObject({ kind: 'time', defaultKg: null, defaultRestSeconds: 0 });
    expect(edited.favorite).toBe(false);

    // The stranger neither sees nor changes it.
    expect(await exercises.listExercises(b.client)).toHaveLength(31);
    await expect(exercises.getExercise(b.client, created.id)).rejects.toMatchObject({
      code: 'not_found',
    });
    await expect(
      exercises.updateExercise(b.client, created.id, { name: 'Hack', muscleGroup: 'Peito' }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(exercises.deleteExercise(b.client, created.id)).rejects.toMatchObject({
      code: 'not_found',
    });

    await exercises.deleteExercise(a.client, created.id);
    await expect(exercises.getExercise(a.client, created.id)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('validates input and protects the built-in library', async () => {
    const { client } = await createTestUser('Validator');
    await expect(
      exercises.createExercise(client, { name: 'x', muscleGroup: 'Peito' }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      exercises.createExercise(client, { name: '°°°', muscleGroup: 'Peito' }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      exercises.createExercise(client, { name: 'Valid', muscleGroup: 'Peito', defaultReps: 0 }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(exercises.getExercise(client, 'not-a-uuid')).rejects.toMatchObject({
      code: 'validation',
    });

    const bench = await libraryId(client, 'supino-reto-com-barra');
    await expect(
      exercises.updateExercise(client, bench, { name: 'Mine now', muscleGroup: 'Peito' }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(exercises.deleteExercise(client, bench)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('keeps favorites and notes per user', async () => {
    const a = await createTestUser('Fan');
    const b = await createTestUser('Other');
    const bench = await libraryId(a.client, 'supino-reto-com-barra');

    await exercises.setFavorite(a.client, bench, true);
    await exercises.setNotes(a.client, bench, 'Banco na 30');
    expect(await exercises.getExercise(a.client, bench)).toMatchObject({
      favorite: true,
      notes: 'Banco na 30',
    });
    // Setting one field keeps the other.
    await exercises.setFavorite(a.client, bench, false);
    expect(await exercises.getExercise(a.client, bench)).toMatchObject({
      favorite: false,
      notes: 'Banco na 30',
    });
    expect(await exercises.getExercise(b.client, bench)).toMatchObject({
      favorite: false,
      notes: '',
    });
    await expect(exercises.setNotes(a.client, bench, 'x'.repeat(501))).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('refuses to delete a custom exercise still used by a routine', async () => {
    const { client } = await createTestUser('InUse');
    const mine = await exercises.createExercise(client, {
      name: 'Remada unilateral',
      muscleGroup: 'Costas',
    });
    await routines.saveRoutine(client, {
      name: 'Costas',
      exercises: [{ exerciseId: mine.id, sets: 3, reps: 10 }],
    });
    await expect(exercises.deleteExercise(client, mine.id)).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('reports the logged history of an exercise', async () => {
    const user = await createTestUser('Lifter');
    const bench = await libraryId(user.client, 'supino-reto-com-barra');
    expect(await exercises.getExerciseHistory(user.client, bench)).toEqual({
      lastSets: [],
      lastPerformedAt: null,
      best: null,
      sessions: 0,
    });

    const admin = adminClient();
    const insertSession = async (startedAt: string, sets: [number, number][]) => {
      const { data, error } = await admin
        .from('workout_sessions')
        .insert({
          owner_id: user.id,
          title: 'Treino A',
          started_at: startedAt,
          ended_at: startedAt,
        })
        .select('id')
        .single();
      if (error) throw error;
      const rows = sets.map(([kg, reps], i) => ({
        session_id: data.id,
        exercise_id: bench,
        exercise_position: 0,
        set_index: i,
        kg,
        reps,
      }));
      const res = await admin.from('session_sets').insert(rows);
      if (res.error) throw res.error;
    };
    await insertSession('2026-10-12T10:00:00Z', [
      [62.5, 6],
      [60, 8],
    ]);
    await insertSession('2026-10-19T10:00:00Z', [
      [60, 8],
      [60, 7],
    ]);

    const history = await exercises.getExerciseHistory(user.client, bench);
    expect(history.lastSets).toEqual([
      { kg: 60, reps: 8 },
      { kg: 60, reps: 7 },
    ]);
    expect(history.best).toEqual({ kg: 62.5, reps: 6 });
    expect(history.sessions).toBe(2);
    expect(history.lastPerformedAt).toMatch(/^2026-10-19/);

    // Nobody else sees it.
    const other = await createTestUser('Peeker');
    expect((await exercises.getExerciseHistory(other.client, bench)).sessions).toBe(0);
  });
});
