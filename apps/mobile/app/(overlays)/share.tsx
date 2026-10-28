import { useLocalSearchParams } from 'expo-router';

import { ShareScreen } from '@/features/share';

/** `/share?template=today|evo|pr|week|run|month&style=ink|sand|brand|photo` */
export default function ShareRoute() {
  const { template, style } = useLocalSearchParams<{ template?: string; style?: string }>();
  return <ShareScreen template={template} style={style} />;
}
