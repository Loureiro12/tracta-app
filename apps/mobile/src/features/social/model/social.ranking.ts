import { toDateKey } from '@/shared/clock';

import { avatarColor } from './social.constants';

import type { Participant } from './social.types';
import type { social } from '@tracta/api';

export type RankRow = { participant: Participant; points: number; position: number };

export type GridCellKind = 'point' | 'none' | 'next' | 'off';

export type ChallengeView = {
  challenge: social.Challenge;
  started: boolean;
  /** 1-based day of the challenge today (clamped to its length). */
  dayNumber: number;
  /** Participants, the user first. */
  participants: Participant[];
  rows: RankRow[];
  me: RankRow;
  /** Points scored today, per participant id. */
  todayPoints: Record<string, number>;
  /** 0-based week shown in the grid (the one containing today). */
  week: number;
  /** Grid cells (7) of the shown week, per participant id. */
  cells: Record<string, GridCellKind[]>;
  startDate: Date;
  endDate: Date;
};

/** YYYY-MM-DD → local Date at midnight. */
export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const diffDays = (a: Date, b: Date): number => Math.round((a.getTime() - b.getTime()) / 86_400_000);

/** First and last day of a challenge starting today or tomorrow (wizard preview). */
export function challengeDates(
  today: Date,
  start: 'today' | 'tomorrow',
  days: number,
): { startDate: Date; endDate: Date } {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDate = start === 'tomorrow' ? addDays(base, 1) : base;
  return { startDate, endDate: addDays(startDate, days - 1) };
}

/**
 * Ranking of a challenge from its board: total points per participant, sorted by points, ties
 * share a position and the user comes first within a tie (prototype `chView`).
 */
export function challengeView(
  board: social.ChallengeBoard,
  meId: string,
  meName: string,
  meColor: string,
  todayKey: string,
): ChallengeView {
  const { challenge, entries } = board;
  const startDate = fromDateKey(challenge.startsOn);
  const endDate = addDays(startDate, challenge.days - 1);
  const today = fromDateKey(todayKey);
  const started = todayKey >= challenge.startsOn;
  const dayNumber = started ? Math.min(challenge.days, diffDays(today, startDate) + 1) : 0;

  const byUser = new Map<string, social.BoardEntry[]>();
  for (const e of entries) byUser.set(e.userId, [...(byUser.get(e.userId) ?? []), e]);
  const userIds = [...byUser.keys()].sort((a, b) => (a === meId ? -1 : b === meId ? 1 : 0));

  const todayPoints: Record<string, number> = {};
  const totals: Record<string, number> = {};
  const pointsByDay: Record<string, Map<string, number>> = {};
  const participants = userIds.map<Participant>((userId) => {
    const rows = byUser.get(userId) ?? [];
    const first = rows[0];
    const id = userId === meId ? 'me' : (first?.handle ?? userId);
    const todayRow = rows.find((r) => r.day === todayKey);
    totals[id] = rows.reduce((sum, r) => sum + r.points, 0);
    todayPoints[id] = todayRow?.points ?? 0;
    pointsByDay[id] = new Map(rows.filter((r) => r.day).map((r) => [r.day ?? '', r.points]));
    return {
      id,
      userId,
      name: userId === meId ? meName : (first?.name ?? ''),
      color: userId === meId ? meColor : avatarColor(userId),
      done: todayRow?.done === true,
      what: todayRow?.what ?? undefined,
      min: todayRow?.activeMinutes ?? 0,
      at: todayRow?.at ?? undefined,
    };
  });

  const scored = participants.map((participant) => ({
    participant,
    points: started ? (totals[participant.id] ?? 0) : 0,
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
  const me = rows.find((r) => r.participant.id === 'me') ?? {
    participant: {
      id: 'me',
      userId: meId,
      name: meName,
      color: meColor,
      done: false,
      min: 0,
    },
    points: 0,
    position: rows.length + 1,
  };

  const week = started ? Math.floor((dayNumber - 1) / 7) : 0;
  const cells: Record<string, GridCellKind[]> = {};
  for (const p of participants) {
    cells[p.id] = Array.from({ length: 7 }, (_, i): GridCellKind => {
      const index = week * 7 + i;
      if (index >= challenge.days) return 'off';
      const key = toDateKey(addDays(startDate, index));
      if (!started || key > todayKey) return 'next';
      return (pointsByDay[p.id]?.get(key) ?? 0) > 0 ? 'point' : 'none';
    });
  }

  return {
    challenge,
    started,
    dayNumber,
    participants,
    rows,
    me,
    todayPoints,
    week,
    cells,
    startDate,
    endDate,
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
