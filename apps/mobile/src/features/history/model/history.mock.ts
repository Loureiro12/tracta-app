/**
 * Mock history data ported from the prototype (`W`, `KIND`, `RUNS`, `ENDD`, `ROUTE`, `histVals`,
 * `engageVals`). Strings here are data (exercise names, routine names), not UI copy.
 *
 * The routines are a trimmed copy of the workouts' mock: the workouts feature is still a stub and
 * does not export `routines` yet; swap this for `@/features/workouts` once it does.
 */
import type {
  DayItem,
  HistorySession,
  Routine,
  RoutineId,
  RunPoint,
  RunSession,
  RunSplit,
  SessionKind,
  StrengthSession,
} from './history.types';

export const HISTORY_YEAR = 2026;
/** October (0-based). */
export const HISTORY_MONTH = 9;
export const TODAY = 26;
export const DAYS_IN_MONTH = 31;
/** 1 October 2026 is a Thursday; the grid starts on Monday. */
export const FIRST_DAY_OFFSET = 3;
export const CALENDAR_CELLS = 35;

/** Base count of sessions in the month before any deletion (prototype `monthCount`). */
export const MONTH_WORKOUTS_BASE = 14;
export const MONTH_RUN_KM = '38,4 km';
export const MONTH_VOLUME = '42,2 t';

export const routines: readonly Routine[] = [
  {
    id: 'A',
    name: 'Treino A',
    focus: 'Peito & Tríceps',
    endDay: 19,
    exercises: [
      {
        id: 'supino-reto',
        name: 'Supino reto com barra',
        reps: 8,
        prev: [
          [60, 8],
          [60, 8],
          [60, 7],
          [57.5, 8],
        ],
      },
      {
        id: 'supino-inclinado',
        name: 'Supino inclinado',
        reps: 10,
        prev: [
          [22, 10],
          [22, 10],
          [22, 10],
        ],
      },
      {
        id: 'crucifixo',
        name: 'Crucifixo na máquina',
        reps: 12,
        prev: [
          [35, 12],
          [35, 12],
          [35, 11],
        ],
      },
      {
        id: 'triceps-corda',
        name: 'Tríceps na corda',
        reps: 12,
        prev: [
          [25, 12],
          [25, 12],
          [25, 10],
        ],
      },
      {
        id: 'mergulho',
        name: 'Mergulho nas paralelas',
        reps: 10,
        prev: [
          [null, 10],
          [null, 9],
          [null, 8],
        ],
      },
    ],
  },
  {
    id: 'B',
    name: 'Treino B',
    focus: 'Costas & Bíceps',
    endDay: 21,
    exercises: [
      {
        id: 'puxada-frontal',
        name: 'Puxada frontal',
        reps: 10,
        prev: [
          [55, 10],
          [55, 10],
          [55, 9],
          [50, 10],
        ],
      },
      {
        id: 'remada-curvada',
        name: 'Remada curvada',
        reps: 8,
        prev: [
          [50, 8],
          [50, 8],
          [50, 7],
          [50, 7],
        ],
      },
      {
        id: 'remada-baixa',
        name: 'Remada baixa',
        reps: 12,
        prev: [
          [45, 12],
          [45, 12],
          [45, 11],
        ],
      },
      {
        id: 'rosca-direta',
        name: 'Rosca direta',
        reps: 10,
        prev: [
          [14, 10],
          [14, 10],
          [14, 8],
        ],
      },
    ],
  },
  {
    id: 'C',
    name: 'Treino C',
    focus: 'Pernas',
    endDay: 23,
    exercises: [
      {
        id: 'agachamento',
        name: 'Agachamento livre',
        reps: 6,
        prev: [
          [80, 6],
          [80, 6],
          [80, 6],
          [75, 6],
        ],
      },
      {
        id: 'leg-press',
        name: 'Leg press 45°',
        reps: 10,
        prev: [
          [160, 10],
          [160, 10],
          [160, 9],
          [150, 10],
        ],
      },
      {
        id: 'extensora',
        name: 'Cadeira extensora',
        reps: 12,
        prev: [
          [45, 12],
          [45, 12],
          [45, 10],
        ],
      },
      {
        id: 'stiff',
        name: 'Stiff',
        reps: 10,
        prev: [
          [50, 10],
          [50, 10],
          [50, 9],
        ],
      },
      {
        id: 'panturrilha',
        name: 'Panturrilha em pé',
        reps: 15,
        prev: [
          [60, 15],
          [60, 15],
          [60, 14],
          [60, 12],
        ],
      },
    ],
  },
];

/** Which routine (or run) happened on each day of the month. */
export const dayKind: Readonly<Record<number, RoutineId | 'R'>> = {
  2: 'C',
  5: 'A',
  7: 'B',
  9: 'C',
  12: 'A',
  14: 'B',
  16: 'C',
  19: 'A',
  21: 'B',
  23: 'C',
  3: 'R',
  6: 'R',
  10: 'R',
  13: 'R',
  17: 'R',
  20: 'R',
  24: 'R',
};

/** Run summaries per day: "distance · time · pace". */
export const runSummaries: Readonly<Record<number, string>> = {
  3: '5,2 km · 29:40 · 5:42 /km',
  6: '4,8 km · 27:05 · 5:38 /km',
  10: '7,5 km · 42:30 · 5:40 /km',
  13: '5,0 km · 28:10 · 5:38 /km',
  17: '7,8 km · 44:02 · 5:39 /km',
  20: '5,1 km · 28:20 · 5:33 /km',
  24: '8,2 km · 45:41 · 5:34 /km',
};

/** Base pace of the mock run generator (seconds per km). */
const BASE_PACE = 335;

export const allExercises = routines.flatMap((r) => r.exercises);

export function dateOf(day: number): Date {
  return new Date(HISTORY_YEAR, HISTORY_MONTH, day);
}

export function seedOf(day: number): number {
  return (day * 7919) % 1000;
}

export function sessionId(kind: SessionKind, day: number): string {
  return `${kind}-${day}`;
}

export function parseSessionId(id: string): { kind: SessionKind; day: number } | null {
  const m = /^(strength|run)-(\d{1,2})$/.exec(id);
  if (!m) return null;
  return { kind: m[1] as SessionKind, day: Number(m[2]) };
}

/** "2026-10-19" → 19 (only the current mock month is supported). */
export function dayFromDateParam(date: string | undefined): number | null {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const day = m ? Number(m[3]) : Number(date);
  if (!Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH) return null;
  return day;
}

export function dateParamOf(day: number): string {
  return `${HISTORY_YEAR}-${String(HISTORY_MONTH + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function parseRunSummary(summary: string): { dist: number; sec: number } {
  const m = /([\d,]+) km · (\d+):(\d+)/.exec(summary);
  if (!m) return { dist: 0, sec: 0 };
  return {
    dist: parseFloat((m[1] ?? '0').replace(',', '.')),
    sec: Number(m[2]) * 60 + Number(m[3]),
  };
}

/** Activity kind of a day after deletions, or null. */
export function activityOf(day: number, deleted: readonly string[]): SessionKind | null {
  const k = dayKind[day];
  if (!k || day > TODAY) return null;
  const kind: SessionKind = k === 'R' ? 'run' : 'strength';
  return deleted.includes(sessionId(kind, day)) ? null : kind;
}

/** Steps/sleep of a day; null after today. */
export function dayHealth(day: number): { steps: number; sleepMinutes: number } | null {
  if (day > TODAY) return null;
  if (day === TODAY) return { steps: 6842, sleepMinutes: 410 };
  const seed = seedOf(day);
  return { steps: 6000 + seed * 7, sleepMinutes: 390 + (seed % 90) };
}

export function dayItems(day: number, deleted: readonly string[]): DayItem[] {
  const items: DayItem[] = [];
  const kind = activityOf(day, deleted);
  if (day < TODAY && kind === 'strength') {
    const routine = routines.find((r) => r.id === dayKind[day]);
    if (routine) {
      items.push({
        id: sessionId('strength', day),
        kind: 'strength',
        routineName: routine.name,
        focus: routine.focus,
        minutes: 48 + (seedOf(day) % 14),
        sets: routine.exercises.reduce((s, e) => s + e.prev.length, 0),
      });
    }
  }
  if (day < TODAY && kind === 'run') {
    items.push({ id: sessionId('run', day), kind: 'run', summary: runSummaries[day] ?? '' });
  }
  if (day === TODAY) {
    const routine = routines[0];
    if (routine) {
      items.push({
        id: `planned-${day}`,
        kind: 'planned',
        routineName: routine.name,
        focus: routine.focus,
      });
    }
  }
  return items;
}

// ---------------------------------------------------------------------------
// Evolution series (prototype `evoSeries` / `runList`)
// ---------------------------------------------------------------------------

export type EvoSeriesPoint = { date: Date; kg: number | null; reps: number; vol: number };

/** Eight weekly points ending on the routine's latest session, eased towards the top load. */
export function evoSeries(exerciseId: string): EvoSeriesPoint[] {
  const routine = routines.find((r) => r.exercises.some((e) => e.id === exerciseId));
  const exercise = routine?.exercises.find((e) => e.id === exerciseId);
  if (!routine || !exercise) return [];
  const bodyweight = exercise.prev[0]?.[0] == null;
  const topKg = bodyweight ? 0 : Math.max(...exercise.prev.map((p) => p[0] ?? 0));
  const topReps = Math.max(...exercise.prev.map((p) => p[1]));
  const sets = exercise.prev.length;
  const points: EvoSeriesPoint[] = [];
  for (let k = 7; k >= 0; k--) {
    const date = dateOf(routine.endDay - 7 * k);
    const f = (7 - k) / 7;
    const ease = 1 - Math.pow(1 - f, 1.6);
    const kgValue = bodyweight
      ? null
      : k === 0
        ? topKg
        : Math.round((topKg * 0.82 + topKg * 0.18 * ease) / 2.5) * 2.5;
    const reps = bodyweight
      ? k === 0
        ? topReps
        : Math.round(topReps - 3 + 3 * ease)
      : exercise.reps;
    const vol = Math.round(bodyweight ? reps * sets : (kgValue ?? 0) * reps * sets * 0.94);
    points.push({ date, kg: kgValue, reps, vol });
  }
  return points;
}

export function runPoints(deleted: readonly string[]): RunPoint[] {
  return Object.keys(runSummaries)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((day) => !deleted.includes(sessionId('run', day)))
    .map((day) => {
      const { dist, sec } = parseRunSummary(runSummaries[day] ?? '');
      return { date: dateOf(day), dist, sec, pace: sec / dist, hr: 146 + (seedOf(day) % 12) };
    });
}

// ---------------------------------------------------------------------------
// Session detail (prototype `histVals`)
// ---------------------------------------------------------------------------

export function strengthSession(day: number): StrengthSession | null {
  const k = dayKind[day];
  if (!k || k === 'R') return null;
  const routine = routines.find((r) => r.id === k);
  if (!routine) return null;
  const weeksAgo = Math.round((routine.endDay - day) / 7);
  const index = 7 - weeksAgo;
  let sets = 0;
  let reps = 0;
  let volume = 0;
  const exercises = routine.exercises.map((e) => {
    const series = evoSeries(e.id);
    const point = series[index] ?? series[series.length - 1];
    const bodyweight = e.prev[0]?.[0] == null;
    const top = bodyweight ? 0 : Math.max(...e.prev.map((p) => p[0] ?? 0));
    const diff = bodyweight ? 0 : top - (point?.kg ?? top);
    const history = series.slice(0, index).map((q) => (bodyweight ? q.reps : (q.kg ?? 0)));
    const current = bodyweight ? (point?.reps ?? 0) : (point?.kg ?? 0);
    const pr = index > 0 && history.length > 0 && current > Math.max(...history);
    const logged = e.prev.map((p) => ({
      kg: bodyweight ? null : Math.max(0, (p[0] ?? 0) - diff),
      reps: bodyweight ? Math.max(1, p[1] - (top ? 0 : weeksAgo)) : p[1],
    }));
    logged.forEach((s) => {
      sets += 1;
      reps += s.reps;
      if (s.kg) volume += s.kg * s.reps;
    });
    return { id: e.id, name: e.name, bodyweight, pr, sets: logged };
  });
  const seed = seedOf(day);
  return {
    id: sessionId('strength', day),
    kind: 'strength',
    day,
    routine,
    startMinutes: 18 * 60 + 20 + (seed % 40),
    durationMinutes: 48 + (seed % 14),
    exercises,
    totals: { sets, reps, volume },
  };
}

/** Route placeholder: a closed loop in a 358×230 box (prototype `ROUTE`). */
const ROUTE: [number, number][] = Array.from({ length: 81 }, (_, i) => {
  const t = (i / 80) * Math.PI * 2 - Math.PI / 2;
  return [
    179 + 118 * Math.cos(t) + 26 * Math.cos(3 * t),
    115 + 74 * Math.sin(t) + 16 * Math.sin(2 * t),
  ];
});

function pathOf(points: [number, number][]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
}

export function routeAt(fraction: number): RunSession['route'] {
  const n = Math.max(1, Math.round(Math.min(1, fraction) * 80));
  const partial = ROUTE.slice(0, n + 1);
  const end = partial[partial.length - 1] ?? [0, 0];
  return { full: pathOf(ROUTE), partial: pathOf(partial), cx: end[0], cy: end[1] };
}

export function splitsFor(distanceKm: number, seconds: number): RunSplit[] {
  const whole = Math.floor(distanceKm);
  const paces: number[] = [];
  for (let k = 1; k <= whole; k++) paces.push(BASE_PACE + ((k * 37) % 17) - 8);
  const rest = distanceKm - whole;
  if (rest > 0.05 && seconds) {
    const used = paces.reduce((a, b) => a + b, 0);
    paces.push(Math.max(BASE_PACE - 20, (seconds - used) / rest));
  }
  const min = Math.min(...paces);
  const max = Math.max(...paces);
  return paces.map((pace, i) => ({
    km: i < whole ? i + 1 : Math.round(rest * 100) / 100,
    partial: i >= whole,
    paceSeconds: pace,
    width: Math.round(100 - (max === min ? 0 : (pace - min) / (max - min)) * 45),
    best: pace === min,
  }));
}

export function runSession(day: number): RunSession | null {
  const summary = runSummaries[day];
  if (!summary) return null;
  const { dist, sec } = parseRunSummary(summary);
  return {
    id: sessionId('run', day),
    kind: 'run',
    day,
    distanceKm: dist,
    seconds: sec,
    paceSeconds: sec / dist,
    heartRate: 146 + (seedOf(day) % 12),
    splits: splitsFor(dist, sec),
    route: routeAt(1),
  };
}

export function sessionById(id: string | undefined): HistorySession | null {
  const parsed = id ? parseSessionId(id) : null;
  if (!parsed) return null;
  return parsed.kind === 'strength' ? strengthSession(parsed.day) : runSession(parsed.day);
}

// ---------------------------------------------------------------------------
// Records, badges and recap (prototype `engageVals`)
// ---------------------------------------------------------------------------

export type RecordId =
  'bench' | 'squat' | 'deadlift' | 'pullup' | '5k' | '10k' | 'longest' | 'best1k';

export type RecordRow = { id: RecordId; value: string; hasDelta: boolean };

export const recordGroups: readonly { id: 'strength' | 'run'; rows: readonly RecordRow[] }[] = [
  {
    id: 'strength',
    rows: [
      { id: 'bench', value: '82,5 kg', hasDelta: true },
      { id: 'squat', value: '100 kg', hasDelta: true },
      { id: 'deadlift', value: '120 kg', hasDelta: true },
      { id: 'pullup', value: '11 reps', hasDelta: true },
    ],
  },
  {
    id: 'run',
    rows: [
      { id: '5k', value: '27:41', hasDelta: true },
      { id: '10k', value: '58:12', hasDelta: true },
      { id: 'longest', value: '12,4 km', hasDelta: true },
      { id: 'best1k', value: '4:46', hasDelta: false },
    ],
  },
];

export type EarnedBadgeId = 'streak12' | 'workouts50' | 'first5k' | 'oneTon';
export type LockedBadgeId = 'perfectMonth' | 'tenKSub55' | 'streak30' | 'workouts100';
export type BadgeId = EarnedBadgeId | LockedBadgeId;

export type BadgeTone = 'brand' | 'ink' | 'run' | 'danger' | 'sleep';

export type Badge =
  | { id: EarnedBadgeId; mark: string; tone: BadgeTone; earned: true; earnedOn: Date }
  | { id: LockedBadgeId; mark: string; tone: BadgeTone; earned: false; progress: number };

export const badges: readonly Badge[] = [
  { id: 'streak12', mark: '12', tone: 'brand', earned: true, earnedOn: dateOf(25) },
  { id: 'workouts50', mark: '50', tone: 'ink', earned: true, earnedOn: dateOf(14) },
  { id: 'first5k', mark: '5K', tone: 'run', earned: true, earnedOn: new Date(HISTORY_YEAR, 8, 2) },
  { id: 'oneTon', mark: '1t', tone: 'danger', earned: true, earnedOn: dateOf(21) },
  { id: 'perfectMonth', mark: '4/4', tone: 'sleep', earned: false, progress: 0.75 },
  { id: 'tenKSub55', mark: '10K', tone: 'run', earned: false, progress: 0.6 },
  { id: 'streak30', mark: '30', tone: 'brand', earned: false, progress: 0.4 },
  { id: 'workouts100', mark: '100', tone: 'ink', earned: false, progress: 0.64 },
];

export type RecapSlideIndex = 0 | 1 | 2 | 3 | 4;

export type RecapSlide = {
  index: RecapSlideIndex;
  bg: 'ink' | 'brand' | 'bg' | 'danger' | 'sleep';
  /** Light text on a dark background. */
  light: boolean;
  big: string;
};

export const recapSlides: readonly RecapSlide[] = [
  { index: 0, bg: 'ink', light: true, big: '16' },
  { index: 1, bg: 'brand', light: true, big: '58 km' },
  { index: 2, bg: 'bg', light: false, big: '42,2 t' },
  { index: 3, bg: 'danger', light: true, big: '3' },
  { index: 4, bg: 'sleep', light: true, big: '7h 02' },
];
