import { useAccount } from '@/shared/session';

import { useProfileStore } from '../model/profile.store';

import type { ProPlan, ProState } from '../model/profile.types';

const FREE: ProState = { active: false, plan: 'year', trial: false, cancelled: false };

export type ProStatus = {
  /** Effective state: the simulated purchase when there is one, the server status otherwise. */
  pro: ProState;
  isPro: boolean;
  /** True when `pro` mirrors the server subscription (real dates available). */
  fromServer: boolean;
  /** Server dates (only when `fromServer`): trial end, and end of the paid period. */
  trialEndsAt: Date | null;
  periodEnd: Date | null;
  subscribe: (plan: ProPlan) => void;
  restore: () => void;
  switchPlan: () => void;
  cancel: () => void;
  reactivate: () => void;
};

/**
 * Pro status = server subscription (read-only, written by the store webhook) with a LOCAL
 * SIMULATION on top: there is no App Store / RevenueCat integration yet, so buying, restoring,
 * switching or cancelling only changes an in-memory copy until the app relaunches or signs out.
 */
export function useProStatus(): ProStatus {
  const { data, refetch } = useAccount();
  const simulated = useProfileStore((s) => s.simulatedPro);
  const setSimulated = useProfileStore((s) => s.setSimulatedPro);

  const sub = data?.subscription ?? null;
  const serverPro: ProState =
    sub && data?.isPro
      ? {
          active: true,
          plan: sub.plan,
          trial: sub.status === 'trialing',
          cancelled: sub.cancelAtPeriodEnd,
        }
      : FREE;
  const pro = simulated ?? serverPro;
  const fromServer = !simulated && serverPro.active;
  const toDate = (iso: string | null | undefined) => (fromServer && iso ? new Date(iso) : null);

  return {
    pro,
    isPro: serverPro.active || Boolean(simulated?.active),
    fromServer,
    trialEndsAt: toDate(sub?.trialEndsAt),
    periodEnd: toDate(sub?.currentPeriodEnd),
    subscribe: (plan) =>
      setSimulated({ active: true, plan, trial: plan === 'year', cancelled: false }),
    restore: () => {
      // A real restore re-reads the server; the simulation keeps the layout flow working.
      void refetch();
      if (!serverPro.active)
        setSimulated({ active: true, plan: 'year', trial: false, cancelled: false });
    },
    switchPlan: () => setSimulated({ ...pro, plan: pro.plan === 'month' ? 'year' : 'month' }),
    cancel: () => setSimulated({ ...pro, cancelled: true }),
    reactivate: () => setSimulated({ ...pro, cancelled: false }),
  };
}
