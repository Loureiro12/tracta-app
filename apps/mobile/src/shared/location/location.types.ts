/** One raw fix from the device (or the E2E fake). */
export type GeoPoint = {
  lat: number;
  lng: number;
  /** Epoch ms (real clock). */
  t: number;
  /** Horizontal accuracy radius in metres; null when the platform does not report it. */
  accuracy: number | null;
};

/** `always` = also with the screen locked; `foreground` = while the app is open (Android uses a
 *  foreground service for locked-screen tracking with this one). */
export type LocationPermission = 'always' | 'foreground' | 'denied';

export type TrackingOptions = {
  /** Android foreground-service notification (required by the OS while tracking). */
  notification: { title: string; body: string };
  /** Expected pace in s/km. Only the E2E fake uses it, to play back a plausible activity. */
  paceHintSec?: number;
};

/** Where GPS points come from. The app uses the device; E2E builds use a deterministic fake. */
export type LocationSource = {
  /** Asks the OS for location access (foreground, then background where it makes sense). */
  requestPermission: () => Promise<LocationPermission>;
  /** Starts recording into `useLocationStore`. Resolves false when location is not available. */
  start: (options: TrackingOptions) => Promise<boolean>;
  stop: () => Promise<void>;
};
