import { testId } from '@tracta/design-system';

/** Single source of truth for tour test IDs. Flows live in e2e/flows/tour. */
export const tourIds = {
  screen: testId('tour', 'screen'),
  modal: testId('tour', 'modal'),
  modalTitle: testId('tour', 'modal', 'title'),
  modalPrimary: testId('tour', 'modal', 'primary'),
  modalSecondary: testId('tour', 'modal', 'secondary'),
  tab: testId('tour', 'tab'),
  spot: testId('tour', 'spot'),
  spotStep: testId('tour', 'spot', 'step'),
  spotTitle: testId('tour', 'spot', 'title'),
  spotBody: testId('tour', 'spot', 'body'),
  spotSkip: testId('tour', 'spot', 'skip'),
  spotBack: testId('tour', 'spot', 'back'),
  spotNext: testId('tour', 'spot', 'next'),
} as const;
