import { queryClient } from '@/shared/api';

import { exercisesKeys, fetchExerciseLibrary } from './useExercises';
import { fetchRoutines, routinesKeys } from './useRoutines';

/**
 * Loads what a workout needs before it's needed, so one started with no internet has every routine
 * and exercise even if the user never opened those screens. Failures are ignored: it runs again
 * the next time the app is online.
 */
export function prefetchTrainingData(userId: string): Promise<unknown> {
  return Promise.all([
    queryClient.prefetchQuery({ queryKey: routinesKeys.list(userId), queryFn: fetchRoutines }),
    queryClient.prefetchQuery({
      queryKey: exercisesKeys.library(userId),
      queryFn: fetchExerciseLibrary,
    }),
  ]);
}
