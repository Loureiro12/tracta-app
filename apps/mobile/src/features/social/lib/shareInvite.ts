import { Linking, Platform, Share } from 'react-native';

import { env } from '@/shared/config/env';

import type { ShareTarget } from '../model/social.constants';

export type ShareOutcome = 'opened' | 'skipped' | 'failed';

/** App URL that opens the chosen channel with the message filled in. */
function targetUrl(target: ShareTarget, message: string, subject: string): string {
  const text = encodeURIComponent(message);
  if (target === 'whatsapp') return `whatsapp://send?text=${text}`;
  if (target === 'messages')
    return Platform.OS === 'ios' ? `sms:&body=${text}` : `sms:?body=${text}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${text}`;
}

/**
 * Shares the invite through WhatsApp, Messages or Mail, falling back to the system share sheet
 * when the app is missing. E2E builds skip the system UI (Maestro cannot drive other apps):
 * the screen's "Opening…" toast is the observable result.
 */
export async function shareInvite(
  target: ShareTarget,
  { message, subject }: { message: string; subject: string },
): Promise<ShareOutcome> {
  if (env.isE2E) return 'skipped';
  try {
    await Linking.openURL(targetUrl(target, message, subject));
    return 'opened';
  } catch {
    try {
      await Share.share({ message });
      return 'opened';
    } catch {
      return 'failed';
    }
  }
}
