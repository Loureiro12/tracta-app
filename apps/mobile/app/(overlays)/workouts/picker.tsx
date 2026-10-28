import { useLocalSearchParams } from 'expo-router';

import { PickerScreen } from '@/features/workouts';

export default function PickerRoute() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  return <PickerScreen mode={mode === 'lib' ? 'lib' : 'add'} />;
}
