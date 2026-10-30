import { testId } from '@tracta/design-system';

/**
 * Single source of truth for Social test IDs. Flows live in e2e/flows/social.
 * Dynamic rows derive from their container id: `${socialIds.friends}.<friendId>` (row),
 * `${socialIds.friends}.<friendId>.cheer` (button), `${socialIds.privacyRows}.<key>.switch`,
 * `${socialIds.pending}.<email>.revoke` (cancel an e-mail invite).
 */
export const socialIds = {
  // Hub overlay
  screen: testId('social', 'screen'),
  back: testId('social', 'hub', 'back'),
  title: testId('social', 'hub', 'title'),
  empty: testId('social', 'hub', 'empty'),
  challenges: testId('social', 'hub', 'challenges'),
  create: testId('social', 'hub', 'create'),
  todayMeta: testId('social', 'hub', 'today-meta'),
  friends: testId('social', 'hub', 'friends'),
  requests: testId('social', 'hub', 'requests'),
  pending: testId('social', 'hub', 'pending'),
  invite: testId('social', 'hub', 'invite'),
  privacy: testId('social', 'hub', 'privacy'),
  devNoFriends: testId('social', 'hub', 'dev-no-friends'),

  // Challenge detail overlay
  challengeScreen: testId('social', 'challenge', 'screen'),
  challengeBack: testId('social', 'challenge', 'back'),
  challengeTitle: testId('social', 'challenge', 'title'),
  challengeEyebrow: testId('social', 'challenge', 'eyebrow'),
  ranking: testId('social', 'challenge', 'ranking'),
  meLine: testId('social', 'challenge', 'me-line'),
  train: testId('social', 'challenge', 'train'),
  grid: testId('social', 'challenge', 'grid'),
  feed: testId('social', 'challenge', 'feed'),
  challengeInvite: testId('social', 'challenge', 'invite'),
  leave: testId('social', 'challenge', 'leave'),

  // Invite overlay
  inviteScreen: testId('social', 'invite', 'screen'),
  inviteClose: testId('social', 'invite', 'close'),
  inviteLink: testId('social', 'invite', 'link'),
  inviteCopy: testId('social', 'invite', 'copy'),
  inviteShare: testId('social', 'invite', 'share'),
  inviteQuery: testId('social', 'invite', 'query'),
  inviteSend: testId('social', 'invite', 'send'),
  contacts: testId('social', 'invite', 'contacts'),
  noContacts: testId('social', 'invite', 'no-contacts'),

  // Add-by-link overlay (tracta://social/add/<handle>, opened from an invite link)
  addScreen: testId('social', 'add', 'screen'),
  addBack: testId('social', 'add', 'back'),
  addPerson: testId('social', 'add', 'person'),
  addSend: testId('social', 'add', 'send'),
  addNotFound: testId('social', 'add', 'not-found'),

  // New challenge overlay
  newScreen: testId('social', 'new-challenge', 'screen'),
  newClose: testId('social', 'new-challenge', 'close'),
  newStepTitle: testId('social', 'new-challenge', 'step-title'),
  newTypes: testId('social', 'new-challenge', 'types'),
  newMin: testId('social', 'new-challenge', 'min'),
  newDays: testId('social', 'new-challenge', 'days'),
  newStart: testId('social', 'new-challenge', 'start'),
  newRange: testId('social', 'new-challenge', 'range'),
  newPeople: testId('social', 'new-challenge', 'people'),
  newName: testId('social', 'new-challenge', 'name'),
  newReview: testId('social', 'new-challenge', 'review'),
  newBack: testId('social', 'new-challenge', 'back'),
  newNext: testId('social', 'new-challenge', 'next'),

  // Privacy sheet
  privacyScreen: testId('social', 'privacy', 'screen'),
  privacyRows: testId('social', 'privacy', 'rows'),
} as const;
