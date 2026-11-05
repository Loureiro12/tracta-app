import type { activities, sessions } from '@tracta/api';

export type OutboxPayload =
  | { kind: 'session'; payload: sessions.SaveSessionInput }
  | { kind: 'activity'; payload: activities.SaveActivityInput };

/** A finished workout or activity stored on the device until the server has it. */
export type OutboxEntry = OutboxPayload & {
  /** Also the payload's clientId, which makes sending it again harmless. */
  id: string;
  userId: string;
  createdAt: number;
};
