import { StyleSheet } from 'react-native';

import { Box, Icon, Pressable, Switch, Text, VStack } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

import type { HomeCard } from '../model/home.store';

type EditCardRowProps = {
  card: HomeCard;
  first: boolean;
  last: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
};

/** One row of the "Cartões" list: name + description, ↑ ↓ reorder buttons and the visibility switch. */
export function EditCardRow({ card, first, last, onMove, onToggle }: EditCardRowProps) {
  const { t } = useTranslation('home');
  const name = t(`edit.card.${card.key}.name`);
  return (
    <Box
      testID={`${homeIds.editRows}.${card.key}`}
      direction="row"
      align="center"
      borderColor="divider"
      style={[styles.row, last ? styles.rowLast : null]}
    >
      <VStack flex={1} gap="xxs" style={card.on ? null : styles.dimmed}>
        <Text variant="bodySemibold">{name}</Text>
        <Text variant="caption" color="text2">
          {t(`edit.card.${card.key}.description`)}
        </Text>
      </VStack>
      <Pressable
        testID={`${homeIds.editRows}.${card.key}.up`}
        onPress={() => onMove(-1)}
        disabled={first}
        accessibilityLabel={t('edit.up', { name })}
        style={[styles.arrow, first ? styles.arrowDisabled : null]}
      >
        <Icon name="arrow-up" size={18} />
      </Pressable>
      <Pressable
        testID={`${homeIds.editRows}.${card.key}.down`}
        onPress={() => onMove(1)}
        disabled={last}
        accessibilityLabel={t('edit.down', { name })}
        style={[styles.arrow, last ? styles.arrowDisabled : null]}
      >
        <Icon name="arrow-down" size={18} />
      </Pressable>
      <Box style={styles.switch} align="flex-end" justify="center">
        <Switch
          testID={`${homeIds.editRows}.${card.key}.toggle`}
          value={card.on}
          onValueChange={onToggle}
          accessibilityLabel={t('edit.toggle', { name })}
        />
      </Box>
    </Box>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 66, borderBottomWidth: 1 },
  rowLast: { borderBottomWidth: 0 },
  dimmed: { opacity: 0.45 },
  arrow: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  arrowDisabled: { opacity: 0.25 },
  switch: { width: 60, height: 44 },
});
