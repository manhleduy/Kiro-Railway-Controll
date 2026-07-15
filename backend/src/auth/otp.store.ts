/**
 * In-memory OTP store.
 * Each entry lives for OTP_TTL_MS milliseconds then is considered expired.
 * No external dependency needed — passwords reset is a short-lived flow.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

interface OtpEntry {
  code: string;
  expiresAt: number;
}

const store = new Map<string, OtpEntry>();

export function saveOtp(email: string, code: string): void {
  store.set(email.toLowerCase(), {
    code,
    expiresAt: Date.now() + OTP_TTL_MS,
  });
}

export function verifyOtp(email: string, code: string): boolean {
  const entry = store.get(email.toLowerCase());
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(email.toLowerCase());
    return false;
  }
  return entry.code === code;
}

export function deleteOtp(email: string): void {
  store.delete(email.toLowerCase());
}
