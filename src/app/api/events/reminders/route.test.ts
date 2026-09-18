import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findMany: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock('@/lib/mailer', () => ({
  sendMail: vi.fn(() => Promise.resolve()),
  eventReminderEmail: vi.fn(() => '<html></html>'),
  getAppBaseUrl: vi.fn(() => 'http://localhost:3000'),
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/mailer';

const req = (secret?: string) =>
  new Request('http://localhost/api/events/reminders', {
    headers: secret ? { 'x-cron-secret': secret } : {},
  });

const ORIGINAL_SECRET = process.env.CRON_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = 'test-cron-secret';
  (prisma.event.findMany as any).mockResolvedValue([]);
  (prisma.event.updateMany as any).mockResolvedValue({ count: 0 });
});

afterEach(() => {
  process.env.CRON_SECRET = ORIGINAL_SECRET;
});

describe('GET /api/events/reminders', () => {
  it('401 when the cron secret header is missing or wrong', async () => {
    const res = await GET(req('wrong-secret') as any);
    expect(res.status).toBe(401);
    expect(prisma.event.findMany).not.toHaveBeenCalled();
  });

  it('200 sends a 24h reminder email for an event starting in ~24 hours', async () => {
    const event = {
      id: 'e1',
      title: 'Networking Night',
      startDate: new Date(Date.now() + 24 * 3_600_000),
      endDate: new Date(Date.now() + 26 * 3_600_000),
      meetingLink: null,
      enrollments: [{ user: { email: 'jane@example.com', name: 'Jane' } }],
    };
    (prisma.event.findMany as any).mockResolvedValue([event]);
    const res = await GET(req('test-cron-secret') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.emailsSent).toBe(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: expect.stringContaining('24 hours') }),
    );
  });

  it('skips events outside both reminder windows', async () => {
    const event = {
      id: 'e1',
      title: 'Networking Night',
      startDate: new Date(Date.now() + 10 * 3_600_000),
      endDate: new Date(Date.now() + 12 * 3_600_000),
      meetingLink: null,
      enrollments: [{ user: { email: 'jane@example.com', name: 'Jane' } }],
    };
    (prisma.event.findMany as any).mockResolvedValue([event]);
    const res = await GET(req('test-cron-secret') as any);
    const json = await res.json();
    expect(json.emailsSent).toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('marks past PUBLISHED events as COMPLETED', async () => {
    (prisma.event.updateMany as any).mockResolvedValue({ count: 3 });
    const res = await GET(req('test-cron-secret') as any);
    const json = await res.json();
    expect(json.expiredCount).toBe(3);
    expect(prisma.event.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'COMPLETED' } }),
    );
  });
});
