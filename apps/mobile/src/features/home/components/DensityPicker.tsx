import { StyleSheet } from 'react-native';

import { Box, Pressable, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { homeIds } from '../home.testids';

import type { HomeDensity } from '../model/home.store';
import type { BoxProps } from '@tracta/design-system';

type DensityPickerProps = {
  value: HomeDensity;
  onChange: (value: HomeDensity) => void;
};

/** White pill behind the selected option (spread so `bg` is omitted, not undefined). */
const SELECTED_BG: Pick<BoxProps, 'bg'> = { bg: 'surface' };

const OPTIONS: { value: HomeDensity; testID: string }[] = [
  { value: 'summary', testID: homeIds.editDensitySummary },
  { value: 'detailed', testID: homeIds.editDensityDetailed },
];

/** Two-line segmented control ("Resumida · só os números" / "Detalhada · com gráficos"). */
export function DensityPicker({ value, onChange }: DensityPickerProps) {
  const { t } = useTranslation('home');
  return (
    <Box testID={homeIds.editDensity} bg="fill3" radius="md" p="xs" direction="row" gap="xs">
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={option.testID}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={styles.option}
          >
            <Box
              {...(selected ? SELECTED_BG : {})}
              radius="sm"
              align="center"
              justify="center"
              gap="xxs"
              style={styles.optionInner}
            >
              <Text variant="smallBold" color={selected ? 'text' : 'text2'}>
                {t(`edit.density.${option.value}`)}
              </Text>
              <Text variant="tab" color="text2" numberOfLines={1}>
                {t(`edit.density.${option.value}Sub`)}
              </Text>
            </Box>
          </Pressable>
        );
      })}
    </Box>
  );
}

const styles = StyleSheet.create({
  option: { flex: 1 },
  optionInner: { minHeight: 44 },
});
