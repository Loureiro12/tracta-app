import { describe, expect, it } from 'vitest';

import { achievements, activities, sessions } from '../src';
import { adminClient, anonClient, createTestUser } from './helpers';

import type { TestUser } from './helpers';

async function benchId() {
  const { data } = await adminClient()
    .from('exercises')
    .select('id')
    .is('owner_id', null)
    .eq('slug', 'supino-reto-com-barra')
    .single();
  return data!.id;
}

async function strength(user: TestUser, day: string, kg: number, reps = 10) {
  const bench = await benchId();
  return sessions.saveSession(user.client, {
    title: 'Treino A',
    focus: 'Peito',
    startedAt: `${day}T18:00:00-03:00`,
    endedAt: `${day}T19:00:00-03:00`,
    sets: [{ exerciseId: bench, exercisePosition: 0, setIndex: 0, kg, reps }],
  });
}

function run(user: TestUser, day: string, km: number, secondsPerKm = 330) {
  const splits = Array.from({ length: km }, () => ({ km: 1, seconds: secondsPerKm }));
  return activities.saveActivity(user.client, {
    kind: 'run',
    startedAt: `${day}T07:00:00-03:00`,
    durationSeconds: km * secondsPerKm,
    distanceM: km * 1000,
    gps: true,
    splits,
  });
}

function walk(user: TestUser, day: string) {
  return activities.saveActivity(user.client, {
    kind: 'walk',
    startedAt: `${day}T07:00:00-03:00`,
    durationSeconds: 1800,
    distanceM: 2500,
  });
}

describe('achievements.getAchievements', () => {
  it('returns the 8 badges locked for a new user', async () => {
    const user = await createTestUser();
    const badges = await achievements.getAchievements(user.client, '2026-10-26');
    expect(badges.map((b) => b.id)).toEqual([...achievements.BADGE_IDS]);
    expect(badges.every((b) => b.earnedOn === null && b.progress === 0)).toBe(true);
  });

  it('earns badges from logged entries and reports progress of the locked ones', async () => {
    const user = await createTestUser();
    await strength(user, '2026-10-19', 100); // 1 000 kg
    await run(user, '2026-10-20', 5);
    await walk(user, '2026-10-21');
    const badges = await achievements.getAchievements(user.client, '2026-10-26');
    const byId = Object.fromEntries(badges.map((b) => [b.id, b]));
    expect(byId.oneTon).toMatchObject({ earnedOn: '2026-10-19', progress: 1 });
    expect(byId.first5k).toMatchObject({ earnedOn: '2026-10-20', progress: 1 });
    expect(byId.workouts50).toMatchObject({
      earnedOn: null,
      current: 3,
      target: 50,
      progress: 0.06,
    });
    expect(byId.streak12).toMatchObject({ earnedOn: null, current: 3 });
    expect(byId.tenKSub55).toMatchObject({ earnedOn: null, current: null, progress: 0 });
    // "Today" comes from the client: before the run, first5k is still locked.
    const before = await achievements.getAchievements(user.client, '2026-10-19');
    expect(before.find((b) => b.id === 'first5k')?.earnedOn).toBeNull();
  });

  it('never counts other users and validates the date', async () => {
    const alice = await createTestUser();
    const bob = await createTestUser();
    await strength(alice, '2026-10-19', 100);
    const badges = await achievements.getAchievements(bob.client, '2026-10-26');
    expect(badges.every((b) => b.earnedOn === null)).toBe(true);
    await expect(achievements.getAchievements(bob.client, '26/10/2026')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('requires a session', async () => {
    await expect(achievements.getAchievements(anonClient(), '2026-10-26')).rejects.toMatchObject({
      code: 'not_authenticated',
    });
  });
});

describe('achievements.getMonthlyRecap', () => {
  it('summarizes the month to date with records and the previous month', async () => {
    const user = await createTestUser();
    await strength(user, '2026-09-28', 60);
    await strength(user, '2026-10-05', 62.5);
    await run(user, '2026-10-06', 6, 340);
    await walk(user, '2026-10-30'); // after "today"
    const recap = await achievements.getMonthlyRecap(user.client, '2026-10-26');
    expect(recap).toMatchObject({
      month: '2026-10-01',
      workouts: 2,
      previousWorkouts: 1,
      strengthSessions: 1,
      runs: 1,
      favoriteWeekday: 0,
      runDistanceM: 6000,
      best5kSeconds: 1700,
      volumeKg: 625,
      topFocus: 'Peito',
    });
    expect(recap.records).toHaveLength(1);
    expect(recap.records[0]).toMatchObject({ kg: 62.5, reps: 10, previousKg: 60, firstKg: 60 });
  });

  it('is empty for a new user', async () => {
    const user = await createTestUser();
    const recap = await achievements.getMonthlyRecap(user.client, '2026-10-26');
    expect(recap).toMatchObject({ workouts: 0, records: [], favoriteWeekday: null, streakDays: 0 });
  });
});

describe('achievements.getWeeklySummary', () => {
  it('summarizes Monday–Sunday against the previous week', async () => {
    const user = await createTestUser();
    await strength(user, '2026-10-12', 60);
    await strength(user, '2026-10-19', 62.5);
    await run(user, '2026-10-20', 5);
    await walk(user, '2026-10-26'); // next week
    const week = await achievements.getWeeklySummary(user.client, '2026-10-19');
    expect(week).toMatchObject({
      weekStart: '2026-10-19',
      goal: 4,
      workouts: 2,
      strengthSessions: 1,
      runs: 1,
      runDistanceM: 5000,
      volumeKg: 625,
      previous: { workouts: 1, volumeKg: 600 },
    });
    expect(week.days.map((d) => d.kind)).toEqual([
      'strength',
      'run',
      'rest',
      'rest',
      'rest',
      'rest',
      'rest',
    ]);
    expect(week.records.map((r) => r.kg)).toEqual([62.5]);
    expect(week.longestRun).toMatchObject({ distanceM: 5000, longestOfMonth: true });
  });

  it('rejects a week that does not start on a Monday', async () => {
    const user = await createTestUser();
    await expect(achievements.getWeeklySummary(user.client, '2026-10-20')).rejects.toMatchObject({
      code: 'validation',
    });
  });
});
