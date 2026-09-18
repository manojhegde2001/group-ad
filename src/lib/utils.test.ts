import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCompactNumber, getLinkDomain, formatEventDate } from './utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('shows "just now" for timestamps under a minute old', () => {
    expect(formatDate(new Date(Date.now() - 5_000))).toBe('just now');
  });

  it('shows minutes for timestamps under an hour old', () => {
    expect(formatDate(new Date(Date.now() - 5 * 60_000))).toBe('5m ago');
  });

  it('shows hours for timestamps under a day old', () => {
    expect(formatDate(new Date(Date.now() - 3 * 3_600_000))).toBe('3h ago');
  });

  it('shows days for timestamps under 30 days old', () => {
    expect(formatDate(new Date(Date.now() - 4 * 86_400_000))).toBe('4d ago');
  });

  it('falls back to a short date for anything older than 30 days', () => {
    const old = new Date(Date.now() - 40 * 86_400_000);
    const expected = old.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    expect(formatDate(old)).toBe(expected);
  });

  it('accepts an ISO string as well as a Date', () => {
    expect(formatDate(new Date(Date.now() - 5_000).toISOString())).toBe('just now');
  });
});

describe('formatCompactNumber', () => {
  it('leaves small numbers unformatted', () => {
    expect(formatCompactNumber(42)).toBe('42');
  });

  it('compacts thousands', () => {
    expect(formatCompactNumber(1500)).toBe('1.5K');
  });

  it('compacts millions', () => {
    expect(formatCompactNumber(2_000_000)).toBe('2M');
  });
});

describe('getLinkDomain', () => {
  it('extracts the hostname without a www prefix', () => {
    expect(getLinkDomain('https://www.example.com/path')).toBe('example.com');
  });

  it('keeps a hostname that has no www prefix', () => {
    expect(getLinkDomain('https://sub.example.com/path')).toBe('sub.example.com');
  });

  it('returns the original string when the URL is invalid', () => {
    expect(getLinkDomain('not-a-url')).toBe('not-a-url');
  });
});

describe('formatEventDate', () => {
  it('formats a date with a long month, day, year, and time', () => {
    const formatted = formatEventDate('2026-06-01T10:00:00');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('June');
  });
});
