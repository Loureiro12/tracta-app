import { useMemo } from 'react';

import Svg, { Rect } from 'react-native-svg';

import { Box, HStack, Pressable, Text, useTheme } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { LoadStepper } from './LoadStepper';
import { sessionIds } from '../session.testids';

import type { ViewStyle } from 'react-native';

type Props = {
  num: number;
  previous: string;
  hasKg: boolean;
  kgValue: string;
  repsValue: string;
  repsUnit: string;
  isBar: boolean;
  onKg: (delta: 1 | -1) => void;
  onReps: (delta: 1 | -1) => void;
  onPlates: () => void;
};

/** The expanded (active) set: load/reps steppers and the plate-calculator link for bar exercises. */
export function ActiveSetCard({
  num,
  previous,
  hasKg,
  kgValue,
  repsValue,
  repsUnit,
  isBar,
  onKg,
  onReps,
  onPlates,
}: Props) {
  const { t } = useTranslation('session');
  const theme = useTheme();
  const platesStyle = useMemo<ViewStyle>(
    () => ({
      height: 40,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.colors.fill2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    }),
    [theme],
  );
  return (
    <Box
      testID={sessionIds.activeSet}
      bg="surface"
      borderColor="ink"
      borderWidth={1.5}
      radius="pill"
      p="ml"
      gap="md"
    >
      <HStack justify="space-between">
        <Text variant="secondaryBold" color="brandText">
          {t('set.title', { num })}
        </Text>
        <Text variant="secondary" color="text2">
          {t('set.previous', { value: previous })}
        </Text>
      </HStack>
      <HStack gap="sm" align="stretch">
        {hasKg ? (
          <LoadStepper
            testID={sessionIds.setKg}
            value={kgValue}
            unit={t('set.kgUnit')}
            onDecrement={() => onKg(-1)}
            onIncrement={() => onKg(1)}
            decrementLabel={t('set.kgMinus')}
            incrementLabel={t('set.kgPlus')}
          />
        ) : null}
        <LoadStepper
          testID={sessionIds.setReps}
          value={repsValue}
          unit={repsUnit}
          onDecrement={() => onReps(-1)}
          onIncrement={() => onReps(1)}
          decrementLabel={t('set.repsMinus')}
          incrementLabel={t('set.repsPlus')}
        />
      </HStack>
      {isBar ? (
        <Pressable
          testID={sessionIds.setPlates}
          onPress={onPlates}
          accessibilityLabel={t('set.plates')}
          style={platesStyle}
        >
          <Svg width={22} height={12} viewBox="0 0 22 12">
            <Rect x={0} y={5} width={22} height={2} rx={1} fill={theme.colors.ink} />
            <Rect x={3} y={1} width={3} height={10} rx={1} fill={theme.colors.ink} />
            <Rect x={16} y={1} width={3} height={10} rx={1} fill={theme.colors.ink} />
          </Svg>
          <Text variant="secondaryBold">{t('set.plates')}</Text>
        </Pressable>
      ) : null}
    </Box>
  );
}
