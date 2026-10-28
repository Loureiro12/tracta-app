import { StyleSheet } from 'react-native';

import { useRouter } from 'expo-router';

import {
  BackHeader,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  HStack,
  Screen,
  Text,
  VStack,
} from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { PlanOption } from '../components/PlanOption';
import { PAYWALL_ROWS } from '../model/profile.mock';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

import type { PaywallContext } from '../model/profile.types';

const CONTEXTS: readonly PaywallContext[] = ['programs', 'race', 'intervals', 'evolution'];

type PaywallScreenProps = {
  /** Pro feature that opened the paywall (`?context=programs`); unknown values are ignored. */
  context?: string;
};

export function PaywallScreen({ context }: PaywallScreenProps) {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const selectedPlan = useProfileStore((s) => s.selectedPlan);
  const selectPlan = useProfileStore((s) => s.selectPlan);
  const subscribe = useProfileStore((s) => s.subscribe);
  const restorePurchase = useProfileStore((s) => s.restorePurchase);

  const ctx = CONTEXTS.find((c) => c === context);
  const isYear = selectedPlan === 'year';

  const buy = () => {
    subscribe(selectedPlan);
    showToast(isYear ? t('paywall.trialToast') : t('paywall.welcomeToast'));
    router.back();
  };
  const restore = () => {
    restorePurchase();
    showToast(t('paywall.restoredToast'));
    router.back();
  };

  return (
    <Screen
      testID={ids.paywallScreen}
      header={
        <BackHeader testID={ids.paywallBack} label={t('nav.back')} onPress={() => router.back()} />
      }
      footer={
        <Box px="screen" pt="md" pb="lg" gap="xs" borderColor="divider" style={styles.footer}>
          <Button
            testID={ids.paywallBuy}
            label={isYear ? t('paywall.ctaYear') : t('paywall.ctaMonth')}
            size="lg"
            fullWidth
            onPress={buy}
          />
          <Box align="center">
            <Button
              testID={ids.paywallRestore}
              label={t('paywall.restore')}
              variant="ghost"
              size="sm"
              onPress={restore}
            />
          </Box>
        </Box>
      }
    >
      {ctx ? (
        <Box align="flex-start">
          <Chip
            testID={ids.paywallContext}
            label={t('paywall.contextLine', { feature: t(`paywall.context.${ctx}`) })}
            tone="brand"
            size="sm"
          />
        </Box>
      ) : null}
      <Text testID={ids.paywallTitle} variant="overlayTitle">
        {t('paywall.headline')}
      </Text>

      <Card testID={ids.paywallTable} px="lg" py="xs" gap="none">
        <HStack gap="sm" style={styles.headRow}>
          <Box style={styles.grow} />
          <Box style={styles.col}>
            <Text variant="captionBold" color="text2" align="center">
              {t('paywall.colFree')}
            </Text>
          </Box>
          <Box style={styles.col}>
            <Text variant="captionBold" color="brandText" align="center">
              {t('paywall.colPro')}
            </Text>
          </Box>
        </HStack>
        <Divider strong />
        {PAYWALL_ROWS.map((row, i) => (
          <Box key={row.key}>
            <HStack gap="sm" style={styles.row}>
              <Box style={styles.grow}>
                <Text variant="small">{t(`paywall.rows.${row.key}`)}</Text>
              </Box>
              <Box style={styles.col}>
                <Text
                  variant="smallBold"
                  color={row.free === 'no' ? 'text3' : 'text'}
                  align="center"
                >
                  {row.free === 'yes'
                    ? t('paywall.yes')
                    : row.free === 'no'
                      ? t('paywall.no')
                      : t('paywall.limited')}
                </Text>
              </Box>
              <Box style={styles.col}>
                <Text variant="smallBold" color="brandText" align="center">
                  {row.free === 'limited' ? t('paywall.all') : t('paywall.yes')}
                </Text>
              </Box>
            </HStack>
            {i < PAYWALL_ROWS.length - 1 ? <Divider /> : null}
          </Box>
        ))}
      </Card>

      <VStack gap="sm">
        <PlanOption
          testID={ids.paywallPlanYear}
          name={t('paywall.yearName')}
          description={t('paywall.yearDescription')}
          price={t('paywall.yearPrice')}
          tag={t('paywall.yearTag')}
          selected={isYear}
          onPress={() => selectPlan('year')}
        />
        <PlanOption
          testID={ids.paywallPlanMonth}
          name={t('paywall.monthName')}
          description={t('paywall.monthDescription')}
          price={t('paywall.monthPrice')}
          selected={!isYear}
          onPress={() => selectPlan('month')}
        />
      </VStack>
      <Text variant="caption" color="text2">
        {isYear ? t('paywall.fineYear') : t('paywall.fineMonth')}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1 },
  headRow: { minHeight: 40 },
  row: { minHeight: 44 },
  grow: { flex: 1 },
  col: { width: 64 },
});
