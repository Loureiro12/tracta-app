/** Activity modalities from the prototype's `MOD` table. `intervals` is `run` + an interval plan. */
export type ModalityId =
  | 'run'
  | 'walk'
  | 'bike'
  | 'swim'
  | 'soccer'
  | 'basket'
  | 'tennis'
  | 'functional'
  | 'stretch'
  | 'yoga';

export type Modality = {
  id: ModalityId;
  /** Records a GPS route (distance, pace, splits). */
  gps: boolean;
  /** Typical pace in seconds per km (GPS modalities): drives the E2E GPS playback. */
  paceSec?: number;
  /** Shows km/h instead of min/km. */
  speed?: boolean;
  /** Manual pool log on the summary. */
  swim?: boolean;
};

export type IntervalConfig = {
  reps: number;
  workSec: number;
  restSec: number;
  warmSec: number;
};

export type PhaseKind = 'warmup' | 'work' | 'recovery' | 'cooldown';

export type IntervalPhase = {
  kind: PhaseKind;
  sec: number;
  /** 1-based rep number, `work` phases only. */
  index?: number;
  total?: number;
};

export type ActiveRun = {
  type: ModalityId;
  gps: boolean;
  intervals: IntervalConfig | null;
  /** Epoch ms. */
  startedAt: number;
  pausedAt: number | null;
  /** Closed pauses as [from, to] epoch ms; time and distance inside them are not counted. */
  pauses: [number, number][];
};

export type RunSummary = {
  type: ModalityId;
  gps: boolean;
  /** Activity seconds, pauses excluded. */
  sec: number;
  distKm: number | null;
  swimMeters: number | null;
  /** Per-km splits from the recorded points (last one may be partial). */
  splits: Split[];
  /** Recorded GPS track ([lat, lng]); null without GPS or without enough fixes. */
  route: [number, number][] | null;
};

export type Split = {
  /** Whole km number, or null for the trailing partial km. */
  km: number | null;
  partialKm: number | null;
  paceSec: number;
  /** Bar width 0..1 (fastest split = 1). */
  width: number;
  fastest: boolean;
};

export type SavingState = 0 | 1 | 2;
