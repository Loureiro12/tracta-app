import { useRouter } from 'expo-router';

import { ListGroup, ListRow, Sheet, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { modalities } from '../model/workouts.mock';
import { workoutsRoutes } from '../model/workouts.routes';
import { workoutsIds as ids } from '../workouts.testids';

/** "Outras modalidades" sheet: every modality besides run/walk, with what each one records. */
export function ModalitiesSheetScreen() {
  const { t } = useTranslation('workouts');
  const router = useRouter();
  const others = modalities.filter((m) => m.id !== 'run' && m.id !== 'walk');
  return (
    <Sheet
      testID={ids.modalitiesScreen}
      title={t('modalities.title')}
      rightLabel={t('actions.close')}
      onClose={() => router.back()}
    >
      <Text variant="small" color="text2">
        {t('modalities.intro')}
      </Text>
      <ListGroup testID={ids.modalitiesList}>
        {others.map((m) => (
          <ListRow
            key={m.id}
            testID={`${ids.modalitiesList}.${m.id}`}
            label={t(`modality.${m.id}.label`)}
            description={t(`modality.${m.id}.description`)}
            chevron
            onPress={() => router.replace(workoutsRoutes.run(m.id))}
          />
        ))}
      </ListGroup>
    </Sheet>
  );
}
