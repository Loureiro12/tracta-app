export type ChallengeType = 'day' | 'minutes' | 'steps';
export type ChallengeStart = 'today' | 'tomorrow';

/** A friend as the screens show them (built from `social.Friend`). */
export type FriendView = {
  /** User id (api calls). */
  userId: string;
  /** Stable key for testIDs and lists: the handle, or the id when there is none. */
  key: string;
  name: string;
  /** Avatar hue (data, not a theme token). */
  color: string;
  /** "@handle" or an empty string. */
  handle: string;
  done: boolean;
  /** Short description of today's main activity, when the friend shares it. */
  what?: string | undefined;
  min: number;
  steps: number;
  streak: number;
};

export type ChallengeDraft = {
  step: 1 | 2 | 3 | 4;
  type: ChallengeType;
  /** Minimum minutes for the `day` type. */
  min: number;
  days: 7 | 14 | 30;
  start: ChallengeStart;
  /** User ids of the invited friends. */
  members: string[];
  name: string;
};

export type PrivacyKey = 'done' | 'kind' | 'streak' | 'loads' | 'prs';
export type SocialPrivacy = Record<PrivacyKey, boolean>;

/** A ranking participant: a friend or the user ('me'). */
export type Participant = {
  /** 'me' or the friend key (handle). */
  id: string;
  userId: string;
  name: string;
  color: string;
  done: boolean;
  what?: string | undefined;
  min: number;
  /** ISO time of today's activity. */
  at?: string | undefined;
};
