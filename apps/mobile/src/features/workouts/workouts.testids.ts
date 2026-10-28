import { testId } from '@tracta/design-system';

/**
 * Dynamic lists use a container id as prefix: the container carries the prefix itself and each
 * item is `${prefix}.${key}` (e.g. `workouts.routines` → `workouts.routines.A`).
 */
export const workoutsIds = {
  // Treinos tab
  screen: testId('workouts', 'screen'),
  header: testId('workouts', 'header'),
  newRoutine: testId('workouts', 'new'),
  week: testId('workouts', 'week'),
  startRun: testId('workouts', 'start', 'run'),
  startWalk: testId('workouts', 'start', 'walk'),
  startFree: testId('workouts', 'start', 'free'),
  startOthers: testId('workouts', 'start', 'others'),
  startIntervals: testId('workouts', 'start', 'intervals'),
  intervalsPro: testId('workouts', 'start', 'intervals', 'pro'),
  programActive: testId('workouts', 'program', 'active'),
  programsCard: testId('workouts', 'programs', 'card'),
  programsPro: testId('workouts', 'programs', 'pro'),
  raceCard: testId('workouts', 'race', 'card'),
  raceChip: testId('workouts', 'race', 'chip'),
  raceStats: testId('workouts', 'race', 'stats'),
  routines: testId('workouts', 'routines'),
  routinesEmpty: testId('workouts', 'routines', 'empty'),
  routinesEmptyCreate: testId('workouts', 'routines', 'empty', 'create'),
  routinesEmptyPrograms: testId('workouts', 'routines', 'empty', 'programs'),
  library: testId('workouts', 'library'),

  // Routine detail overlay
  detailScreen: testId('workouts', 'detail', 'screen'),
  detailBack: testId('workouts', 'detail', 'back'),
  detailTitle: testId('workouts', 'detail', 'title'),
  detailStats: testId('workouts', 'detail', 'stats'),
  detailExercises: testId('workouts', 'detail', 'exercises'),
  detailStart: testId('workouts', 'detail', 'start'),
  detailEdit: testId('workouts', 'detail', 'edit'),
  detailDuplicate: testId('workouts', 'detail', 'duplicate'),

  // Builder
  builderScreen: testId('workouts', 'builder', 'screen'),
  builderCancel: testId('workouts', 'builder', 'cancel'),
  builderTitle: testId('workouts', 'builder', 'title'),
  builderName: testId('workouts', 'builder', 'name'),
  builderDescription: testId('workouts', 'builder', 'description'),
  builderDays: testId('workouts', 'builder', 'days'),
  builderMeta: testId('workouts', 'builder', 'meta'),
  builderEmpty: testId('workouts', 'builder', 'empty'),
  builderExercises: testId('workouts', 'builder', 'exercises'),
  builderAdd: testId('workouts', 'builder', 'add'),
  builderSave: testId('workouts', 'builder', 'save'),

  // Exercise picker
  pickerScreen: testId('workouts', 'picker', 'screen'),
  pickerClose: testId('workouts', 'picker', 'close'),
  pickerTitle: testId('workouts', 'picker', 'title'),
  pickerSearch: testId('workouts', 'picker', 'search'),
  pickerCategories: testId('workouts', 'picker', 'categories'),
  pickerCreate: testId('workouts', 'picker', 'create'),
  pickerItems: testId('workouts', 'picker', 'items'),
  pickerEmpty: testId('workouts', 'picker', 'empty'),
  pickerAdd: testId('workouts', 'picker', 'add'),

  // Exercise form
  formScreen: testId('workouts', 'exercise-form', 'screen'),
  formCancel: testId('workouts', 'exercise-form', 'cancel'),
  formTitle: testId('workouts', 'exercise-form', 'title'),
  formName: testId('workouts', 'exercise-form', 'name'),
  formGroups: testId('workouts', 'exercise-form', 'groups'),
  formSecondary: testId('workouts', 'exercise-form', 'secondary'),
  formEquipment: testId('workouts', 'exercise-form', 'equipment'),
  formTypes: testId('workouts', 'exercise-form', 'types'),
  formReps: testId('workouts', 'exercise-form', 'reps'),
  formLoad: testId('workouts', 'exercise-form', 'load'),
  formRest: testId('workouts', 'exercise-form', 'rest'),
  formDuration: testId('workouts', 'exercise-form', 'duration'),
  formNotes: testId('workouts', 'exercise-form', 'notes'),
  formFavorite: testId('workouts', 'exercise-form', 'favorite'),
  formSave: testId('workouts', 'exercise-form', 'save'),

  // Exercise detail
  exerciseScreen: testId('workouts', 'exercise', 'screen'),
  exerciseClose: testId('workouts', 'exercise', 'close'),
  exerciseTitle: testId('workouts', 'exercise', 'title'),
  exerciseSubtitle: testId('workouts', 'exercise', 'subtitle'),
  exerciseTags: testId('workouts', 'exercise', 'tags'),
  exerciseInstructions: testId('workouts', 'exercise', 'instructions'),
  exerciseDefaults: testId('workouts', 'exercise', 'defaults'),
  exerciseHistory: testId('workouts', 'exercise', 'history'),
  exerciseHistoryEmpty: testId('workouts', 'exercise', 'history', 'empty'),
  exerciseEvolution: testId('workouts', 'exercise', 'evolution'),
  exerciseNotes: testId('workouts', 'exercise', 'notes'),
  exerciseFavorite: testId('workouts', 'exercise', 'favorite'),
  exerciseCustom: testId('workouts', 'exercise', 'custom'),
  exerciseEdit: testId('workouts', 'exercise', 'edit'),
  exerciseDelete: testId('workouts', 'exercise', 'delete'),

  // Programs
  programsScreen: testId('workouts', 'programs', 'screen'),
  programsBack: testId('workouts', 'programs', 'back'),
  programsTitle: testId('workouts', 'programs', 'title'),
  programsList: testId('workouts', 'programs', 'list'),
  programTitle: testId('workouts', 'programs', 'detail', 'title'),
  programWeek: testId('workouts', 'programs', 'detail', 'week'),
  programWeeks: testId('workouts', 'programs', 'detail', 'weeks'),
  programCta: testId('workouts', 'programs', 'detail', 'cta'),

  // Sheets
  intervalsScreen: testId('workouts', 'intervals', 'screen'),
  intervalsReps: testId('workouts', 'intervals', 'reps'),
  intervalsWork: testId('workouts', 'intervals', 'work'),
  intervalsRest: testId('workouts', 'intervals', 'rest'),
  intervalsWarm: testId('workouts', 'intervals', 'warm'),
  intervalsStructure: testId('workouts', 'intervals', 'structure'),
  intervalsTotal: testId('workouts', 'intervals', 'total'),
  intervalsStart: testId('workouts', 'intervals', 'start'),

  raceScreen: testId('workouts', 'race', 'screen'),
  raceDistances: testId('workouts', 'race', 'distances'),
  raceDate: testId('workouts', 'race', 'date'),
  raceGoal: testId('workouts', 'race', 'goal'),
  raceRows: testId('workouts', 'race', 'rows'),
  raceRemove: testId('workouts', 'race', 'remove'),
  raceSave: testId('workouts', 'race', 'save'),

  modalitiesScreen: testId('workouts', 'modalities', 'screen'),
  modalitiesList: testId('workouts', 'modalities', 'list'),
} as const;
