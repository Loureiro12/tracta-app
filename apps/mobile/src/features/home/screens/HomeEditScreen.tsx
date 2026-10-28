import { useRouter } from 'expo-router';

import {
  Box,
  Button,
  Card,
  HStack,
  ListRow,
  Sheet,
  Switch,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { DensityPicker } from '../components/DensityPicker';
import { EditCardRow } from '../components/EditCardRow';
import { homeIds } from '../home.testids';
import { useHomeStore } from '../model/home.store';

/** "Personalizar início" bottom sheet: density, card order/visibility and restore. */
export function HomeEditScreen() {
  const router = useRouter();
  const { t } = useTranslation('home');
  const showToast = useFeedbackStore((s) => s.showToast);
  const cards = useHomeStore((s) => s.cards);
  const density = useHomeStore((s) => s.density);
  const isNewUser = useHomeStore((s) => s.isNewUser);
  const moveCard = useHomeStore((s) => s.moveCard);
  const toggleCard = useHomeStore((s) => s.toggleCard);
  const setDensity = useHomeStore((s) => s.setDensity);
  const setNewUser = useHomeStore((s) => s.setNewUser);
  const reset = useHomeStore((s) => s.reset);
  const visible = cards.filter((c) => c.on).length;

  return (
    <Sheet
      testID={homeIds.editSheet}
      title={t('edit.title')}
      rightLabel={t('edit.done')}
      onClose={() => router.back()}
    >
      <VStack gap="md" pt="sm" pb="2xl">
        <Text variant="secondarySemibold">{t('edit.view')}</Text>
        <DensityPicker value={density} onChange={setDensity} />

        <HStack gap="sm" justify="space-between" align="baseline" pt="sm">
          <Text variant="secondarySemibold">{t('edit.cards')}</Text>
          <Text testID={homeIds.editCount} variant="caption" color="text2">
            {t('edit.count', { visible, total: cards.length })}
          </Text>
        </HStack>
        <Card testID={homeIds.editRows} variant="outline" padding="none" px="lg" gap="none">
          {cards.map((card, i) => (
            <EditCardRow
              key={card.key}
              card={card}
              first={i === 0}
              last={i === cards.length - 1}
              onMove={(direction) => moveCard(card.key, direction)}
              onToggle={() => toggleCard(card.key)}
            />
          ))}
        </Card>
        <Text testID={homeIds.editNote} variant="caption" color="text2">
          {t('edit.note')}
        </Text>
        <Box align="flex-start">
          <Button
            testID={homeIds.editReset}
            label={t('edit.restore')}
            variant="secondary"
            size="sm"
            onPress={() => {
              reset();
              showToast(t('edit.restored'));
            }}
          />
        </Box>

        <Card variant="outline" padding="none" px="xl" gap="none">
          <ListRow
            testID={homeIds.editSimulateNewUser}
            label={t('edit.simulateNewUser')}
            last
            trailing={
              <Switch
                testID={`${homeIds.editSimulateNewUser}.switch`}
                value={isNewUser}
                onValueChange={setNewUser}
                accessibilityLabel={t('edit.simulateNewUser')}
              />
            }
          />
        </Card>
      </VStack>
    </Sheet>
  );
}
