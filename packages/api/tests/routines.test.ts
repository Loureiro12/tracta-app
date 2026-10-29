import { describe, expect, it } from 'vitest';

import { exercises, routines } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

import type { TractaClient } from '../src';

async function lib(client: TractaClient) {
  const list = await exercises.listExercises(client);
  const id = (slug: string) => {
    const e = list.find((x) => x.slug === slug && !x.custom);
    if (!e) throw new Error(slug);
    return e.id;
  };
  return {
    bench: id('supino-reto-com-barra'),
    incline: id('supino-inclinado'),
    dips: id('mergulho-nas-paralelas'),
  };
}

describe('routines', () => {
  it('requires a session', async () => {
    await expect(routines.listRoutines(anonClient())).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });

  it('creates routines with the next free label and keeps exercise order', async () => {
    const { client } = await createTestUser('Builder');
    const { bench, incline, dips } = await lib(client);
    expect(await routines.listRoutines(client)).toEqual([]);

    const a = await routines.saveRoutine(client, {
      name: 'Treino A',
      focus: 'Peito & Tríceps',
      weekday: 0,
      exercises: [
        { exerciseId: bench, sets: 4, reps: 8, kg: 60, restSeconds: 120 },
        { exerciseId: incline, sets: 3, reps: 10, kg: 22, restSeconds: 0, superset: 'S1' },
        { exerciseId: dips, sets: 3, reps: 10, kg: null, superset: 'S1' },
      ],
    });
    expect(a).toMatchObject({
      label: 'A',
      name: 'Treino A',
      weekday: 0,
      position: 0,
      lastDoneAt: null,
    });
    expect(a.exercises.map((e) => [e.position, e.exercise.slug, e.superset])).toEqual([
      [0, 'supino-reto-com-barra', null],
      [1, 'supino-inclinado', 'S1'],
      [2, 'mergulho-nas-paralelas', 'S1'],
    ]);
    expect(a.exercises[2]).toMatchObject({ kg: null, restSeconds: 90, lastSets: [] });

    const b = await routines.saveRoutine(client, {
      name: 'Treino B',
      exercises: [{ exerciseId: bench, sets: 3, reps: 10 }],
    });
    expect(b).toMatchObject({ label: 'B', position: 1, weekday: null, focus: '' });
    expect((await routines.listRoutines(client)).map((r) => r.label)).toEqual(['A', 'B']);
  });

  it('updates a routine and replaces its exercises atomically', async () => {
    const { client } = await createTestUser('Editor');
    const { bench, incline, dips } = await lib(client);
    const r = await routines.saveRoutine(client, {
      name: 'Push',
      exercises: [
        { exerciseId: bench, sets: 4, reps: 8 },
        { exerciseId: incline, sets: 3, reps: 10 },
      ],
    });
    // Reorder + replace in one save.
    const updated = await routines.saveRoutine(client, {
      id: r.id,
      name: 'Push day',
      focus: 'Chest',
      weekday: 1,
      exercises: [
        { exerciseId: incline, sets: 5, reps: 8 },
        { exerciseId: dips, sets: 3, reps: 12 },
        { exerciseId: bench, sets: 3, reps: 6, kg: 70 },
      ],
    });
    expect(updated).toMatchObject({
      id: r.id,
      label: r.label,
      name: 'Push day',
      focus: 'Chest',
      weekday: 1,
    });
    expect(updated.exercises.map((e) => [e.exercise.slug, e.sets])).toEqual([
      ['supino-inclinado', 5],
      ['mergulho-nas-paralelas', 3],
      ['supino-reto-com-barra', 3],
    ]);

    // A failing save leaves the previous version intact.
    await expect(
      routines.saveRoutine(client, {
        id: r.id,
        name: 'Broken',
        exercises: [
          { exerciseId: bench, sets: 3, reps: 10 },
          { exerciseId: '00000000-0000-4000-8000-00000000dead', sets: 3, reps: 10 },
        ],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
    const after = await routines.getRoutine(client, r.id);
    expect(after.name).toBe('Push day');
    expect(after.exercises).toHaveLength(3);
  });

  it('validates input', async () => {
    const { client } = await createTestUser('Strict');
    const { bench } = await lib(client);
    await expect(
      routines.saveRoutine(client, { name: 'Empty', exercises: [] }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      routines.saveRoutine(client, {
        name: '  ',
        exercises: [{ exerciseId: bench, sets: 3, reps: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      routines.saveRoutine(client, {
        name: 'Too many',
        exercises: [{ exerciseId: bench, sets: 21, reps: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      routines.saveRoutine(client, {
        name: 'Day',
        weekday: 7,
        exercises: [{ exerciseId: bench, sets: 3, reps: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(routines.getRoutine(client, 'A')).rejects.toMatchObject({ code: 'validation' });
  });

  it('duplicates under the next label without a fixed day', async () => {
    const { client } = await createTestUser('Copier');
    const { bench, incline } = await lib(client);
    const a = await routines.saveRoutine(client, {
      name: 'Treino A',
      focus: 'Peito',
      weekday: 0,
      exercises: [
        { exerciseId: bench, sets: 4, reps: 8, kg: 60 },
        { exerciseId: incline, sets: 3, reps: 10, kg: 22 },
      ],
    });
    const copy = await routines.duplicateRoutine(client, a.id, { name: (l) => `Workout ${l}` });
    expect(copy).toMatchObject({ label: 'B', name: 'Workout B', focus: 'Peito', weekday: null });
    expect(copy.exercises.map((e) => [e.exerciseId, e.sets, e.kg])).toEqual([
      [bench, 4, 60],
      [incline, 3, 22],
    ]);
    expect(routines.nextLabel(['A', 'B', 'D'])).toBe('C');
  });

  it('reports last sets and the last time a routine was done', async () => {
    const user = await createTestUser('Athlete');
    const { bench } = await lib(user.client);
    const r = await routines.saveRoutine(user.client, {
      name: 'Treino A',
      exercises: [{ exerciseId: bench, sets: 2, reps: 8, kg: 60 }],
    });
    const admin = adminClient();
    const { data: s, error } = await admin
      .from('workout_sessions')
      .insert({
        owner_id: user.id,
        routine_id: r.id,
        title: 'Treino A',
        started_at: '2026-10-19T10:00:00Z',
        ended_at: '2026-10-19T11:00:00Z',
      })
      .select('id')
      .single();
    if (error) throw error;
    const sets = await admin.from('session_sets').insert([
      { session_id: s.id, exercise_id: bench, exercise_position: 0, set_index: 0, kg: 60, reps: 8 },
      {
        session_id: s.id,
        exercise_id: bench,
        exercise_position: 0,
        set_index: 1,
        kg: 57.5,
        reps: 8,
      },
    ]);
    if (sets.error) throw sets.error;

    const [listed] = await routines.listRoutines(user.client);
    expect(listed?.lastDoneAt).toMatch(/^2026-10-19/);
    expect(listed?.exercises[0]?.lastSets).toEqual([
      { kg: 60, reps: 8 },
      { kg: 57.5, reps: 8 },
    ]);
  });

  it('isolates routines between users', async () => {
    const a = await createTestUser('Alice');
    const b = await createTestUser('Bob');
    const { bench } = await lib(a.client);
    const mineB = await exercises.createExercise(b.client, {
      name: 'Segredo do Bob',
      muscleGroup: 'Peito',
    });
    const r = await routines.saveRoutine(a.client, {
      name: 'Alice A',
      exercises: [{ exerciseId: bench, sets: 3, reps: 10 }],
    });

    expect(await routines.listRoutines(b.client)).toEqual([]);
    await expect(routines.getRoutine(b.client, r.id)).rejects.toMatchObject({ code: 'not_found' });
    await expect(
      routines.saveRoutine(b.client, {
        id: r.id,
        name: 'Hijack',
        exercises: [{ exerciseId: bench, sets: 3, reps: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
    await expect(routines.deleteRoutine(b.client, r.id)).rejects.toMatchObject({
      code: 'not_found',
    });
    // Alice cannot reference Bob's custom exercise.
    await expect(
      routines.saveRoutine(a.client, {
        name: 'Borrowed',
        exercises: [{ exerciseId: mineB.id, sets: 3, reps: 10 }],
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });

    await routines.deleteRoutine(a.client, r.id);
    expect(await routines.listRoutines(a.client)).toEqual([]);
  });
});
