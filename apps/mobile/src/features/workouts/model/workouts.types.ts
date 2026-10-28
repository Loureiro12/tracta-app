/** How an exercise is logged: load × reps, reps only (bodyweight) or time (cardio/mobility). */
export type ExerciseType = 's' | 'b' | 'c';

/** A [kg, reps] pair from the last session; kg is null for bodyweight exercises. */
export type PrevSet = readonly [number | null, number];

/** An exercise inside a routine, with its prescription. */
export type RoutineExercise = {
  /** Library exercise id (slug of the name). */
  exerciseId: string;
  name: string;
  group: string;
  equipment: string;
  sets: number;
  reps: number;
  /** Starting load in kg; null for bodyweight. For cardio `reps` holds minutes. */
  kg: number | null;
  /** Rest in seconds (0 inside a superset). */
  rest: number;
  /** Superset group key shared by consecutive exercises, or null. */
  superset: string | null;
  cardio: boolean;
  /** Sets from the last session. */
  prev: PrevSet[];
};

export type Routine = {
  /** Letter id: A, B, C… */
  id: string;
  name: string;
  /** "Peito & Tríceps" */
  focus: string;
  /** Weekday index (0 = Monday … 6 = Sunday) or null when there is no fixed day. */
  day: number | null;
  /** Estimated duration in minutes. */
  estMinutes: number;
  /** ISO date of the last time it was performed, or null if never. */
  lastDoneAt: string | null;
  exercises: RoutineExercise[];
};

export type LibraryExercise = {
  /** Slug of the name (stable, URL safe). */
  id: string;
  name: string;
  group: string;
  secondary: string[];
  equipment: string;
  type: ExerciseType;
  /** Default load in kg (null for bodyweight/time). */
  kg: number | null;
  /** Default reps, or minutes for time-based exercises. */
  reps: number;
  /** Default rest in seconds. */
  rest: number;
  notes: string;
  favorite: boolean;
  custom: boolean;
};

/** Day pattern token: routine letter, 'F' full body, '⟶' run, '—' rest. */
export type ProgramDay = string;

export type Program = {
  id: string;
  name: string;
  weeks: number;
  /** "Musculação · intermediário" */
  tag: string;
  /** "3 treinos/semana" */
  frequency: string;
  description: string;
  pattern: ProgramDay[];
  legend: string;
  weekTitles: string[];
  /** Weeks (0-based) that are deload weeks. */
  lightWeeks: number[];
  /** Today's suggestion by weekday index. */
  today: Record<number, string>;
};

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
  /** Display name (pt-BR, as in the prototype data). UI copy lives in the i18n namespace. */
  label: string;
  /** What the modality records, e.g. "GPS · ritmo · parciais". */
  description: string;
  gps: boolean;
  /** Typical pace in seconds per km (GPS modalities). */
  pace: number | null;
  speed: boolean;
  swim: boolean;
};

export type ActiveProgram = { id: string; week: number };

export type RaceDistance = 5 | 10 | 21 | 42;

export type Race = {
  distance: RaceDistance;
  /** Exact distance in km (21.0975 / 42.195 for half/full marathon). */
  km: number;
  /** Weeks from today until the race. */
  weeks: number;
  /** Target time in seconds. */
  goal: number;
};

export type IntervalsConfig = {
  reps: number;
  /** Work interval in seconds. */
  work: number;
  /** Recovery in seconds. */
  rest: number;
  /** Warm-up in seconds. */
  warm: number;
};

/** Exercise being edited inside the builder. */
export type DraftExercise = RoutineExercise;

export type BuilderDraft = {
  /** Existing routine id when editing, null when creating. */
  id: string | null;
  name: string;
  description: string;
  day: number | null;
  exercises: DraftExercise[];
  /** Index of the expanded exercise row (-1 = none). */
  open: number;
};
