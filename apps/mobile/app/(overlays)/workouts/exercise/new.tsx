import { useLocalSearchParams } from 'expo-router';

import { ExerciseFormScreen } from '@/features/workouts';

export default function ExerciseFormRoute() {
  const { name, edit, from } = useLocalSearchParams<{
    name?: string;
    edit?: string;
    from?: string;
  }>();
  return (
    <ExerciseFormScreen name={name} edit={edit} from={from === 'picker' ? 'picker' : undefined} />
  );
}
