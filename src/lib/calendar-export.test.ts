import { describe, it, expect } from 'vitest';
import { generateICS, getGoogleCalendarLink } from './calendar-export';

const params = {
  title: 'Networking Night',
  description: 'Line one\nLine two',
  startDate: new Date('2026-06-01T10:00:00Z'),
  endDate: new Date('2026-06-01T12:00:00Z'),
  location: 'Community Hall',
};

describe('generateICS', () => {
  it('produces a well-formed VCALENDAR block', () => {
    const ics = generateICS(params);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
  });

  it('formats start/end dates as UTC basic ICS timestamps', () => {
    const ics = generateICS(params);
    expect(ics).toContain('DTSTART:20260601T100000Z');
    expect(ics).toContain('DTEND:20260601T120000Z');
  });

  it('escapes newlines in the description', () => {
    const ics = generateICS(params);
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two');
  });

  it('includes LOCATION when provided', () => {
    const ics = generateICS(params);
    expect(ics).toContain('LOCATION:Community Hall');
  });

  it('omits LOCATION when not provided', () => {
    const { location, ...rest } = params;
    const ics = generateICS(rest);
    expect(ics).not.toContain('LOCATION:');
  });
});

describe('getGoogleCalendarLink', () => {
  it('builds a Google Calendar render URL with encoded fields', () => {
    const link = getGoogleCalendarLink(params);
    expect(link).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
    expect(link).toContain('text=Networking%20Night');
    expect(link).toContain('dates=20260601T100000Z/20260601T120000Z');
    expect(link).toContain('location=Community%20Hall');
  });

  it('omits the location param when not provided', () => {
    const { location, ...rest } = params;
    const link = getGoogleCalendarLink(rest);
    expect(link).not.toContain('&location=');
  });
});
