const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmailValid(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Mock rule from the prototype: a login password shorter than this is "incorrect". */
export const MIN_LOGIN_PASSWORD = 6;

export const PASSWORD_RULES = ['length', 'number', 'uppercase'] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

export function checkPasswordRules(password: string): Record<PasswordRule, boolean> {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    uppercase: /[A-Z]/.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  return Object.values(checkPasswordRules(password)).every(Boolean);
}

/** "lucas@x.com" → "Lucas" (prototype fallback for the display name after a login). */
export function nameFromEmail(email: string): string {
  const local = email.trim().split('@')[0] ?? '';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** 90 → "1:30" */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
