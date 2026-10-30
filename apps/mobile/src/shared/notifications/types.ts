/** A local alert scheduled for a moment in time (e.g. the end of a rest between sets). */
export type ScheduledAlert = {
  /** Epoch ms when it fires. */
  at: number;
  title: string;
  body: string;
};

export type Alerts = {
  /** Asks for permission once; later calls resolve with the stored answer. */
  ensurePermission: () => Promise<boolean>;
  /** Schedules the alert with sound; resolves with an id for `cancel`, or null when not allowed. */
  schedule: (alert: ScheduledAlert) => Promise<string | null>;
  cancel: (id: string) => Promise<void>;
};
