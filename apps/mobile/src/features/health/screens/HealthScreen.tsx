import { useEffect } from 'react';

import { Screen } from '@tracta/design-system';

import { ActivitySegment } from '../components/ActivitySegment';
import { BodySegment } from '../components/BodySegment';
import { HealthHeader } from '../components/HealthHeader';
import { SleepSegment } from '../components/SleepSegment';
import { healthIds } from '../health.testids';
import { useHealthStore } from '../model/health.store';

import type { HealthSegment } from '../model/health.types';

type Props = {
  /** Segment to open (from `?tab=` on the route); the store keeps the selection afterwards. */
  initialTab?: HealthSegment | undefined;
};

/** Saúde tab: sticky header + Sono / Atividade / Corpo segments. */
export function HealthScreen({ initialTab }: Props) {
  const segment = useHealthStore((s) => s.segment);
  const setSegment = useHealthStore((s) => s.setSegment);

  useEffect(() => {
    if (initialTab) setSegment(initialTab);
  }, [initialTab, setSegment]);

  return (
    <Screen testID={healthIds.screen} bottomInset="tab" header={<HealthHeader />}>
      {segment === 'sleep' ? <SleepSegment /> : null}
      {segment === 'activity' ? <ActivitySegment /> : null}
      {segment === 'body' ? <BodySegment /> : null}
    </Screen>
  );
}
