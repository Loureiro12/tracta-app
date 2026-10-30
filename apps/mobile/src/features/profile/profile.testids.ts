import { testId } from '@tracta/design-system';

/**
 * Single source of truth for Profile test IDs. Flows live in e2e/flows/profile.
 * Dynamic rows derive from a group id: `${profileIds.goalsGroup}.<key>`.
 */
export const profileIds = {
  screen: testId('profile', 'screen'),
  headerName: testId('profile', 'header', 'name'),
  headerEmail: testId('profile', 'header', 'email'),
  headerEdit: testId('profile', 'header', 'edit'),
  goalsGroup: testId('profile', 'goals-list'),
  sourcesCard: testId('profile', 'sources', 'card'),
  /** Apple Health status in the Sources card ("Connected" / "Not connected"). */
  sourcesAppleStatus: testId('profile', 'sources', 'apple-status'),
  achievements: testId('profile', 'nav', 'achievements'),
  photos: testId('profile', 'nav', 'photos'),
  social: testId('profile', 'nav', 'social'),
  tour: testId('profile', 'nav', 'tour'),
  connections: testId('profile', 'nav', 'connections'),
  prefUnits: testId('profile', 'prefs', 'units'),
  prefAutoRest: testId('profile', 'prefs', 'auto-rest'),
  prefNotifications: testId('profile', 'prefs', 'notifications'),
  prefVisibility: testId('profile', 'prefs', 'visibility'),
  prefPrivacy: testId('profile', 'prefs', 'privacy'),
  prefAppSettings: testId('profile', 'prefs', 'app-settings'),
  logout: testId('profile', 'logout'),

  // Edit profile overlay
  editScreen: testId('profile', 'edit', 'screen'),
  editBack: testId('profile', 'edit', 'back'),
  editName: testId('profile', 'edit', 'name'),
  editEmail: testId('profile', 'edit', 'email'),
  editSave: testId('profile', 'edit', 'save'),
  editCurrentPassword: testId('profile', 'edit', 'current-password'),
  editNewPassword: testId('profile', 'edit', 'new-password'),
  editRules: testId('profile', 'edit', 'rules'),
  editChangePassword: testId('profile', 'edit', 'change-password'),

  // Progress photos overlay
  photosScreen: testId('profile', 'photos', 'screen'),
  photosBack: testId('profile', 'photos', 'back'),
  photosTabs: testId('profile', 'photos', 'tabs'),
  photosTabList: testId('profile', 'photos', 'tabs', 'list'),
  photosTabCompare: testId('profile', 'photos', 'tabs', 'compare'),
  photosAdd: testId('profile', 'photos', 'add'),
  photosAddLibrary: testId('profile', 'photos', 'add-library'),
  photosGrid: testId('profile', 'photos', 'grid'),
  photosSwapA: testId('profile', 'photos', 'swap-a'),
  photosSwapB: testId('profile', 'photos', 'swap-b'),
  photosDiff: testId('profile', 'photos', 'diff'),
  photosSpan: testId('profile', 'photos', 'span'),

  // Notifications overlay
  notificationsScreen: testId('profile', 'notifications', 'screen'),
  notificationsBack: testId('profile', 'notifications', 'back'),
  notificationsDone: testId('profile', 'notifications', 'done'),
  notificationsSystemOff: testId('profile', 'notifications', 'system-off'),
  notificationsAllow: testId('profile', 'notifications', 'allow'),
  notificationsRows: testId('profile', 'notifications', 'rows'),
  notificationsHour: testId('profile', 'notifications', 'hour'),

  // Privacy overlay
  privacyScreen: testId('profile', 'privacy', 'screen'),
  privacyBack: testId('profile', 'privacy', 'back'),
  privacyDone: testId('profile', 'privacy', 'done'),
  privacyOut: testId('profile', 'privacy', 'out'),
  privacyActions: testId('profile', 'privacy', 'actions'),

  // Goals sheet
  goalsScreen: testId('profile', 'goals', 'screen'),
  goalsRows: testId('profile', 'goals', 'rows'),
} as const;
