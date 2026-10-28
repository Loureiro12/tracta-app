import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Box,
  Card,
  ListGroup,
  ListRow,
  Segmented,
  Sheet,
  Stepper,
  Text,
} from '@tracta/design-system';

import { formatNumber, useTranslation } from '@/shared/i18n';

import { PlateBarDrawing } from '../components/PlateBarDrawing';
import { PLATE_BARS, platesPlan } from '../model/session.logic';
import { useSessionStore } from '../model/session.store';
import { sessionIds } from '../session.testids';

import type { PlateBar } from '../model/session.types';
import type { SemanticColors } from '@tracta/design-system';

const kg = (value: number) => formatNumber(value, { maximumFractionDigits: 2 });

function Swatch({ color }: { color: keyof SemanticColors }) {
  return <Box bg={color} style={styles.swatch} />;
}

/** Plate calculator: total load, bar type, bar drawing, plates per side and the "doesn't add up" note. */
export function PlatesSheetScreen() {
  const router = useRouter();
  const { t } = useTranslation('session');
  const platesKg = useSessionStore((s) => s.platesKg);
  const platesBar = useSessionStore((s) => s.platesBar);
  const adjustPlates = useSessionStore((s) => s.adjustPlates);
  const setPlatesBar = useSessionStore((s) => s.setPlatesBar);

  const plan = platesPlan(platesKg, platesBar);
  const note = plan.belowBar
    ? t('plates.belowBar')
    : plan.exact
      ? t('plates.exact')
      : t('plates.inexact', { kg: kg(plan.missingKg) });
  const barOptions = PLATE_BARS.map((bar) => ({
    value: String(bar),
    label: bar === 20 ? t('plates.bar20') : bar === 15 ? t('plates.bar15') : t('plates.bar10'),
  }));

  return (
    <Sheet
      testID={sessionIds.platesSheet}
      title={t('plates.title')}
      rightLabel={t('plates.close')}
      onClose={() => router.back()}
    >
      <Card radius="md" padding="sm" gap="xxs">
        <Text variant="micro" color="text2" align="center">
          {t('plates.total')}
        </Text>
        <Box align="center">
          <Stepper
            testID={sessionIds.platesTotal}
            valueLabel={t('plates.totalValue', { value: kg(platesKg) })}
            onDecrement={() => adjustPlates(-1)}
            onIncrement={() => adjustPlates(1)}
            decrementLabel={t('plates.minus')}
            incrementLabel={t('plates.plus')}
          />
        </Box>
      </Card>

      <Segmented
        testID={sessionIds.platesBar}
        options={barOptions}
        value={String(platesBar)}
        onChange={(value) => setPlatesBar(Number(value) as PlateBar)}
      />

      <Card py="2xl" px="md" gap="none">
        <Box align="center">
          <PlateBarDrawing side={plan.side} />
        </Box>
      </Card>

      <ListGroup testID={sessionIds.platesRow}>
        <ListRow
          testID={`${sessionIds.platesRow}.bar`}
          label={t('plates.barRow')}
          value={t('plates.barValue', { kg: kg(platesBar) })}
          leading={<Swatch color="switchOff" />}
        />
        {plan.counts.map((p, i) => (
          <ListRow
            key={p.kg}
            testID={`${sessionIds.platesRow}.${i}`}
            label={t('plates.perSide', { kg: kg(p.kg) })}
            value={t('plates.count', { count: p.count })}
            leading={<Swatch color={p.color} />}
          />
        ))}
      </ListGroup>

      <Text
        testID={sessionIds.platesNote}
        variant="secondary"
        color={plan.exact && !plan.belowBar ? 'brandText' : 'warnText'}
      >
        {note}
      </Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  swatch: { width: 12, height: 12, borderRadius: 3, marginRight: 2 },
});
