import { useState } from 'react';

import { useRouter } from 'expo-router';

import { BackHeader, ListGroup, ListRow, Screen, Text } from '@tracta/design-system';

import { useFeedbackStore } from '@/shared/feedback';
import { useTranslation } from '@/shared/i18n';

import { ActionButton } from '../components/ActionButton';
import { useProfileStore } from '../model/profile.store';
import { profileIds as ids } from '../profile.testids';

export function ManageScreen() {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const showToast = useFeedbackStore((s) => s.showToast);
  const pro = useProfileStore((s) => s.pro);
  const switchPlan = useProfileStore((s) => s.switchPlan);
  const cancelPro = useProfileStore((s) => s.cancelPro);
  const reactivatePro = useProfileStore((s) => s.reactivatePro);
  const [cancelArmed, setCancelArmed] = useState(false);

  const planName = pro.plan === 'year' ? t('paywall.yearName') : t('paywall.monthName');
  const planPrice = pro.plan === 'year' ? t('paywall.yearPrice') : t('paywall.monthPrice');

  const rows = pro.active
    ? [
        {
          key: 'plan',
          label: t('manage.plan'),
          value: t('manage.planValue', { plan: planName, price: planPrice }),
        },
        {
          key: 'status',
          label: t('manage.status'),
          value: pro.cancelled
            ? t('manage.statusCancelled')
            : pro.trial
              ? t('manage.statusTrial')
              : t('manage.statusActive'),
        },
        {
          key: 'date',
          label: pro.cancelled
            ? t('manage.accessUntil')
            : pro.trial
              ? t('manage.firstCharge')
              : t('manage.renewal'),
          value: pro.cancelled
            ? t('manage.accessUntilValue')
            : pro.trial
              ? t('manage.firstChargeValue')
              : t('manage.renewalValue'),
        },
        { key: 'payment', label: t('manage.payment'), value: t('manage.paymentValue') },
      ]
    : [{ key: 'plan', label: t('manage.plan'), value: t('manage.noPlan') }];

  const onSwitch = () => {
    switchPlan();
    showToast(t('manage.switchedToast'));
  };

  const onCancel = () => {
    if (pro.cancelled) {
      reactivatePro();
      showToast(t('manage.reactivatedToast'));
      return;
    }
    if (!cancelArmed) {
      setCancelArmed(true);
      return;
    }
    setCancelArmed(false);
    cancelPro();
    showToast(t('manage.cancelledToast'));
  };

  const cancelLabel = pro.cancelled
    ? t('manage.reactivate')
    : cancelArmed
      ? t('manage.cancelConfirm')
      : t('manage.cancel');

  return (
    <Screen
      testID={ids.manageScreen}
      header={
        <BackHeader
          testID={ids.manageBack}
          label={t('nav.backToProfile')}
          onPress={() => router.back()}
        />
      }
    >
      <Text variant="overlayTitle">{t('manage.title')}</Text>
      <ListGroup testID={ids.manageRows}>
        {rows.map((row, i) => (
          <ListRow
            key={row.key}
            testID={`${ids.manageRows}.${row.key}`}
            label={row.label}
            labelColor="text2"
            value={row.value}
            last={i === rows.length - 1}
          />
        ))}
      </ListGroup>
      <ActionButton
        testID={ids.manageSwitch}
        label={pro.plan === 'month' ? t('manage.switchToYear') : t('manage.switchToMonth')}
        onPress={onSwitch}
      />
      <ActionButton
        testID={ids.manageCancel}
        label={cancelLabel}
        tone="danger"
        onPress={onCancel}
      />
      <Text variant="caption" color="text2">
        {t('manage.footnote')}
      </Text>
    </Screen>
  );
}
