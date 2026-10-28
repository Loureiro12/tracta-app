import { useLocalSearchParams } from 'expo-router';

import { ShareNudgeScreen } from '@/features/share';

/** `/share/nudge?template=today|run` — post-save "Criar cartão" nudge over the current screen. */
export default function ShareNudgeRoute() {
  const { template } = useLocalSearchParams<{ template?: string }>();
  return <ShareNudgeScreen template={template} />;
}
