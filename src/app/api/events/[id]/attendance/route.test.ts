import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    eventEnrollment: { findMany: vi.fn(), updateMany: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/events/e1/attendance', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.eventEnrollment.findMany as any).mockResolvedValue([]);
  (prisma.notification.createMany as any).mockResolvedValue({ count: 0 });
});

describe('POST /api/events/[id]/attendance', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ attendedUserIds: [] }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ attendedUserIds: [] }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the caller is neither organizer nor admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user' } });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', title: 'Event', organizerId: 'organizer1' });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    const res = await POST(req({ attendedUserIds: [] }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.eventEnrollment.updateMany).not.toHaveBeenCalled();
  });

  it('resets all attendance then marks the given users as attended, notifying only the newly attended', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', title: 'Event', organizerId: 'organizer1' });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([
      { userId: 'u1', attended: false },
      { userId: 'u2', attended: true },
    ]);
    const res = await POST(req({ attendedUserIds: ['u1', 'u2'] }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.eventEnrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { eventId: 'e1' }, data: { attended: false, attendedAt: null } }),
    );
    expect(prisma.eventEnrollment.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ eventId: 'e1', userId: { in: ['u1', 'u2'] } }),
        data: expect.objectContaining({ attended: true }),
      }),
    );
    expect(prisma.notification.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: [expect.objectContaining({ userId: 'u1' })] }),
    );
  });

  it('skips the mark-attended update when attendedUserIds is empty', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', title: 'Event', organizerId: 'organizer1' });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    const res = await POST(req({ attendedUserIds: [] }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.eventEnrollment.updateMany).toHaveBeenCalledTimes(1); // only the reset call
    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });
});
