import { describe, it, expect } from 'vitest';
import { isAdmin, slugify, formatEventDate, getEventStatus } from './event-utils';

describe('isAdmin', () => {
  it('is true only for ADMIN', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('BUSINESS')).toBe(false);
    expect(isAdmin('INDIVIDUAL')).toBe(false);
  });
});

describe('slugify', () => {
  it('lowercases, trims, and hyphenates', () => {
    expect(slugify('  Hello World  ')).toMatch(/^hello-world-[a-z0-9]{5}$/);
  });

  it('strips punctuation while keeping word characters', () => {
    expect(slugify("Doctor's Meetup!")).toMatch(/^doctors-meetup-[a-z0-9]{5}$/);
  });

  it('collapses repeated separators', () => {
    expect(slugify('a   b__c--d')).toMatch(/^a-b-c-d-[a-z0-9]{5}$/);
  });

  it('appends a random suffix so two calls differ', () => {
    expect(slugify('same title')).not.toBe(slugify('same title'));
  });
});

describe('formatEventDate', () => {
  it('formats a same-day event as a single date with a time range', () => {
    const start = new Date('2026-05-01T09:00:00');
    const end = new Date('2026-05-01T17:00:00');
    expect(formatEventDate(start, end)).toBe('Friday, May 1, 2026 · 9:00 AM – 5:00 PM');
  });

  it('formats a multi-day event as a date range', () => {
    const start = new Date('2026-05-01T09:00:00');
    const end = new Date('2026-05-03T17:00:00');
    expect(formatEventDate(start, end)).toBe('May 1 – May 3, 2026');
  });
});

describe('getEventStatus', () => {
  it('returns cancelled regardless of dates when status is CANCELLED', () => {
    const past = new Date(Date.now() - 1000);
    expect(getEventStatus({ startDate: past, endDate: past, status: 'CANCELLED' })).toBe('cancelled');
  });

  it('returns past when the event has already ended', () => {
    const start = new Date(Date.now() - 20000);
    const end = new Date(Date.now() - 10000);
    expect(getEventStatus({ startDate: start, endDate: end, status: 'ACTIVE' })).toBe('past');
  });

  it('returns ongoing when now is between start and end', () => {
    const start = new Date(Date.now() - 10000);
    const end = new Date(Date.now() + 10000);
    expect(getEventStatus({ startDate: start, endDate: end, status: 'ACTIVE' })).toBe('ongoing');
  });

  it('returns upcoming when the event has not started', () => {
    const start = new Date(Date.now() + 10000);
    const end = new Date(Date.now() + 20000);
    expect(getEventStatus({ startDate: start, endDate: end, status: 'ACTIVE' })).toBe('upcoming');
  });
});
