import { STEP_GOAL, friendById, meToday, today } from './social.mock';

import type { Challenge, Participant } from './social.types';

export type RankRow = { participant: Participant; points: number; position: number };

export type ChallengeView = {
  challenge: Challenge;
  started: boolean;
  participants: Participant[];
  rows: RankRow[];
  me: RankRow;
  startDate: Date;
  endDate: Date;
};

export function pointsFor(challenge: Challenge, p: Participant): number {
  if (challenge.type === 'day') return p.done && p.min >= challenge.min ? 1 : 0;
  if (challenge.type === 'minutes') return Math.min(6, Math.floor((p.done ? p.min : 0) / 10));
  return p.steps >= STEP_GOAL ? 1 : 0;
}

export function challengeDates(
  start: Challenge['start'],
  days: number,
): { startDate: Date; endDate: Date } {
  const startDate = new Date(today);
  if (start === 'tomorrow') startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days - 1);
  return { startDate, endDate };
}

/**
 * Ranking of a challenge: points per participant, sorted by points, ties share a position,
 * the user comes first within a tie (prototype `chView`).
 */
export function challengeView(
  challenge: Challenge,
  friendIds: readonly string[],
  meName: string,
  meColor: string,
): ChallengeView {
  const started = challenge.start === 'today';
  const me: Participant = { id: 'me', name: meName, color: meColor, ...meToday };
  const members = challenge.members
    .filter((id) => friendIds.includes(id))
    .map(friendById)
    .filter((f): f is NonNullable<typeof f> => Boolean(f))
    .map<Participant>((f) => ({
      id: f.id,
      name: f.name,
      color: f.color,
      done: f.done,
      what: f.what,
      min: f.min,
      at: f.at,
      steps: f.steps,
    }));
  const participants = [me, ...members];
  const scored = participants.map((participant) => ({
    participant,
    points: started ? pointsFor(challenge, participant) : 0,
  }));
  scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (a.participant.id === 'me') return -1;
    if (b.participant.id === 'me') return 1;
    return 0;
  });
  let position = 0;
  let lastPoints: number | null = null;
  const rows: RankRow[] = scored.map((row, i) => {
    if (row.points !== lastPoints) {
      position = i + 1;
      lastPoints = row.points;
    }
    return { ...row, position };
  });
  const meRow = rows.find((r) => r.participant.id === 'me') as RankRow;
  return {
    challenge,
    started,
    participants,
    rows,
    me: meRow,
    ...challengeDates(challenge.start, challenge.days),
  };
}

export const initials = (name: string): string =>
  name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const firstName = (name: string): string => name.split(' ')[0] ?? name;
