import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findMany: vi.fn() },
    eventEnrollment: { findMany: vi.fn(), updateMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/events/e1/bulk-attendance', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', title: 'Networking Night' });
  (prisma.notification.createMany as any).mockResolvedValue({ count: 0 });
});

describe('POST /api/events/[id]/bulk-attendance', () => {
  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await POST(req({ attendees: [{ email: 'a@example.com' }] }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('400 for an empty attendees list', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ attendees: [] }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ attendees: [{ email: 'a@example.com' }] }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('marks a matched, approved, not-yet-attended user as attended', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1', email: 'a@example.com', username: 'auser' }]);
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([{ userId: 'u1', attended: false }]);
    const res = await POST(req({ attendees: [{ email: 'a@example.com' }] }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.successCount).toBe(1);
    expect(json.failedList).toHaveLength(0);
    expect(prisma.eventEnrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: 'e1', userId: 'u1' } }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalled();
  });

  it('reports failures for unknown users, non-enrolled users, and already-attended users', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([
      { id: 'u2', email: 'notenrolled@example.com', username: null },
      { id: 'u3', email: 'already@example.com', username: null },
    ]);
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([{ userId: 'u3', attended: true }]);
    const res = await POST(
      req({
        attendees: [
          { email: 'unknown@example.com' },
          { email: 'notenrolled@example.com' },
          { email: 'already@example.com' },
        ],
      }) as any,
      ctx as any,
    );
    const json = await res.json();
    expect(json.successCount).toBe(0);
    expect(json.failedList).toHaveLength(3);
    expect(prisma.eventEnrollment.updateMany).not.toHaveBeenCalled();
  });
});
