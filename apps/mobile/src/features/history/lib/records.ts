/** Record rows of the achievements screen, from `history.getRecords`. */
import { clock, decimal, kg } from './format';

import type { history } from '@tracta/api';

export type StrengthRecordId = 'bench' | 'squat' | 'stiff' | 'dip';
export type RunRecordId = '5k' | '10k' | 'longest' | 'best1k';
export type RecordId = StrengthRecordId | RunRecordId;

/** Library exercise behind each strength row. */
export const STRENGTH_RECORDS: readonly { id: StrengthRecordId; slug: string }[] = [
  { id: 'bench', slug: 'supino-reto-com-barra' },
  { id: 'squat', slug: 'agachamento-livre' },
  { id: 'stiff', slug: 'stiff' },
  { id: 'dip', slug: 'mergulho-nas-paralelas' },
];
export const RECORD_SLUGS = STRENGTH_RECORDS.map((r) => r.slug);

/** Raw row: formatted value/delta; `detail` is resolved to copy by the screen. */
export type RecordRow = {
  id: RecordId;
  value: string;
  /** null = no record yet. */
  detail: { reps: number | null; bodyweight: boolean; date: Date } | null;
  /** Improvement over the previous best, "new" for a first record, null without a record. */
  delta: string | 'new' | null;
};

export function strengthRows(records: history.Records): RecordRow[] {
  return STRENGTH_RECORDS.map(({ id, slug }) => {
    const r = records.strength.find((s) => s.slug === slug);
    const best = r?.best;
    if (!r || !best) return { id, value: '—', detail: null, delta: null };
    const prev = r.previous;
    const value = r.bodyweight || best.kg === null ? `${best.reps} reps` : `${kg(best.kg)} kg`;
    let delta: RecordRow['delta'] = 'new';
    if (prev) {
      const kgDiff = (best.kg ?? 0) - (prev.kg ?? 0);
      delta =
        r.bodyweight || kgDiff === 0
          ? `+${best.reps - prev.reps} reps`
          : `+${kg(Math.round(kgDiff * 100) / 100)} kg`;
    }
    return {
      id,
      value,
      detail: {
        reps: r.bodyweight ? null : best.reps,
        bodyweight: r.bodyweight,
        date: new Date(best.achievedAt),
      },
      delta,
    };
  });
}

export function runRows(records: history.Records): RecordRow[] {
  const time = (id: RunRecordId, r: history.RunRecord): RecordRow =>
    r.best
      ? {
          id,
          value: clock(r.best.value),
          detail: { reps: null, bodyweight: false, date: new Date(r.best.achievedAt) },
          delta: r.previous ? `−${clock(r.previous.value - r.best.value)}` : 'new',
        }
      : { id, value: '—', detail: null, delta: null };
  const { longest } = records.run;
  return [
    time('5k', records.run.fiveK),
    time('10k', records.run.tenK),
    longest.best
      ? {
          id: 'longest',
          value: `${decimal(longest.best.value / 1000)} km`,
          detail: { reps: null, bodyweight: false, date: new Date(longest.best.achievedAt) },
          delta: longest.previous
            ? `+${decimal((longest.best.value - longest.previous.value) / 1000)} km`
            : 'new',
        }
      : { id: 'longest', value: '—', detail: null, delta: null },
    time('best1k', records.run.best1k),
  ];
}
