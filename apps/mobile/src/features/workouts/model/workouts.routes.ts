import type { Href } from 'expo-router';

/** Typed routes are generated at `expo start`; hrefs are built as strings so tsc stays green. */
const href = (path: string): Href => path as Href;

/** Every navigation target used by the feature (route groups are omitted from hrefs). */
export const workoutsRoutes = {
  tab: () => href('/workouts'),
  detail: (id: string) => href(`/workouts/${id}`),
  builder: (id?: string) => href(id ? `/workouts/builder?id=${id}` : '/workouts/builder'),
  picker: (mode: 'add' | 'lib') => href(`/workouts/picker?mode=${mode}`),
  exerciseNew: (params: {
    name?: string | undefined;
    edit?: string | undefined;
    from?: 'picker' | undefined;
  }) => {
    const q = new URLSearchParams();
    if (params.name) q.set('name', params.name);
    if (params.edit) q.set('edit', params.edit);
    if (params.from) q.set('from', params.from);
    const s = q.toString();
    return href(`/workouts/exercise/new${s ? `?${s}` : ''}`);
  },
  exercise: (id: string) => href(`/workouts/exercise/${id}`),
  programs: (id?: string) => href(id ? `/workouts/programs?id=${id}` : '/workouts/programs'),
  intervals: () => href('/workouts/intervals'),
  race: () => href('/workouts/race'),
  modalities: () => href('/workouts/modalities'),
  session: (routineId?: string) =>
    href(routineId ? `/session?routineId=${routineId}` : '/session?free=1'),
  run: (type: string) => href(`/run?type=${type}`),
  history: () => href('/history'),
};
