/**
 * Small pure helpers for auth decisions, kept out of the NextAuth config so they
 * can be unit-tested in isolation.
 */

/**
 * Whether an account is allowed past the email-verification gate.
 *
 * - Verified accounts (emailVerified set) pass.
 * - Legacy accounts created before verification existed have neither a verified
 *   date nor a pending token — they pass.
 * - A credentials signup that has not yet clicked its link has a pending token
 *   and no verified date — it is blocked.
 */
export function isEmailVerificationSatisfied(user: {
  emailVerified?: Date | null;
  emailVerificationToken?: string | null;
}): boolean {
  return Boolean(user.emailVerified) || !user.emailVerificationToken;
}

/**
 * Resolves a post-login redirect target to a safe value: relative paths and
 * same-origin absolute URLs are kept; anything else falls back to `baseUrl`.
 * Prevents the callback URL from being used as an open redirect.
 */
export function resolveSafeRedirect(url: string, baseUrl: string): string {
  // A plain relative path. "//host" is protocol-relative (an absolute URL to a
  // browser), so it is explicitly excluded here.
  if (url.startsWith('/') && !url.startsWith('//')) {
    return `${baseUrl}${url}`.replace(/([^:])\/\//g, '$1/');
  }

  try {
    const target = new URL(url, baseUrl);
    const base = new URL(baseUrl);
    if (target.origin === base.origin) {
      return target.toString();
    }
  } catch {
    // not a parseable URL — fall through to the safe default
  }

  return baseUrl;
}
