import { describe, it, expect } from 'vitest';
import { isEmailVerificationSatisfied, resolveSafeRedirect } from './auth-helpers';

describe('isEmailVerificationSatisfied', () => {
  it('passes a verified account', () => {
    expect(isEmailVerificationSatisfied({ emailVerified: new Date(), emailVerificationToken: null })).toBe(true);
  });

  it('passes a legacy account with no verified date and no pending token', () => {
    expect(isEmailVerificationSatisfied({ emailVerified: null, emailVerificationToken: null })).toBe(true);
  });

  it('passes when both fields are undefined', () => {
    expect(isEmailVerificationSatisfied({})).toBe(true);
  });

  it('blocks a new signup that has a pending token and no verified date', () => {
    expect(isEmailVerificationSatisfied({ emailVerified: null, emailVerificationToken: 'abc123' })).toBe(false);
  });

  it('passes once verified even if a stale token is still present', () => {
    expect(isEmailVerificationSatisfied({ emailVerified: new Date(), emailVerificationToken: 'abc123' })).toBe(true);
  });
});

describe('resolveSafeRedirect', () => {
  const base = 'https://vrutta.net';

  it('keeps a relative path, resolved against baseUrl', () => {
    expect(resolveSafeRedirect('/dashboard', base)).toBe('https://vrutta.net/dashboard');
  });

  it('keeps a same-origin absolute URL', () => {
    expect(resolveSafeRedirect('https://vrutta.net/profile/foo', base)).toBe('https://vrutta.net/profile/foo');
  });

  it('rejects a different host and falls back to baseUrl', () => {
    expect(resolveSafeRedirect('https://evil.example/phish', base)).toBe(base);
  });

  it('rejects a protocol-relative URL pointing elsewhere', () => {
    expect(resolveSafeRedirect('//evil.example/phish', base)).toBe(base);
  });

  it('rejects a non-URL string', () => {
    expect(resolveSafeRedirect('javascript:alert(1)', base)).toBe(base);
  });

  it('rejects a same-host different-scheme URL', () => {
    expect(resolveSafeRedirect('http://vrutta.net/x', base)).toBe(base);
  });
});
