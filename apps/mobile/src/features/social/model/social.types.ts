export type FriendId = string;

export type Friend = {
  id: FriendId;
  name: string;
  /** Avatar hue from the prototype's FR data (data, not a theme token). */
  color: string;
  handle: string;
  /** Today's activity (mock). */
  done: boolean;
  what?: string | undefined;
  min: number;
  at?: string | undefined;
  steps: number;
  streak: number;
};

export type ChallengeType = 'day' | 'minutes' | 'steps';
export type ChallengeStart = 'today' | 'tomorrow';

export type Challenge = {
  id: string;
  name: string;
  type: ChallengeType;
  /** Minimum minutes for the `day` type. */
  min: number;
  days: 7 | 14 | 30;
  start: ChallengeStart;
  members: FriendId[];
};

export type ChallengeDraft = Omit<Challenge, 'id'> & { step: 1 | 2 | 3 | 4 };

export type PrivacyKey = 'done' | 'kind' | 'streak' | 'loads' | 'prs';
export type SocialPrivacy = Record<PrivacyKey, boolean>;

/** A ranking participant: a friend or the user. */
export type Participant = {
  id: FriendId | 'me';
  name: string;
  color: string;
  done: boolean;
  what?: string | undefined;
  min: number;
  at?: string | undefined;
  steps: number;
};
