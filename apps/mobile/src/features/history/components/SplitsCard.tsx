import { useMemo } from 'react';

import { StyleSheet } from 'react-native';

import { Box, Card, Text } from '@tracta/design-system';

import { useTranslation } from '@/shared/i18n';

import { historyIds as ids } from '../history.testids';
import { clock, decimal } from '../lib/format';
import { itemId } from '../lib/ids';

import type { RunSplit } from '../model/history.types';
import type { ViewStyle } from 'react-native';

function SplitRow({ split, index }: { split: RunSplit; index: number }) {
  const { t } = useTranslation('history');
  const fillStyle = useMemo<ViewStyle>(() => ({ width: `${split.width}%` }), [split.width]);
  const rowId = itemId(ids.sessionSplits, index + 1);
  return (
    <Box testID={rowId} style={styles.row}>
      <Box style={styles.km}>
        <Text testID={`${rowId}.label`} variant="secondary" color="text2" numberOfLines={1}>
          {split.partial
            ? t('detail.splitPartial', { km: decimal(split.km, 1) })
            : t('detail.splitKm', { km: split.km })}
        </Text>
      </Box>
      <Box flex={1} bg="track" style={styles.track}>
        <Box bg={split.best ? 'brandText' : 'brandOnDark'} style={[styles.fill, fillStyle]} />
      </Box>
      <Box style={styles.pace}>
        <Text
          testID={`${rowId}.pace`}
          variant="smallSemibold"
          align="right"
          tabular
          numberOfLines={1}
        >
          {`${clock(split.paceSeconds)} /km`}
        </Text>
      </Box>
    </Box>
  );
}

/** "Parciais": one bar per kilometre; the fastest split is highlighted. */
export function SplitsCard({ splits }: { splits: readonly RunSplit[] }) {
  const { t } = useTranslation('history');
  return (
    <Card testID={ids.sessionSplits} px="xl" py="lg" gap="xs">
      <Text variant="bodySemibold">{t('detail.splits')}</Text>
      {splits.map((split, i) => (
        <SplitRow key={i} split={split} index={i} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  km: { width: 48 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  pace: { width: 72 },
});
