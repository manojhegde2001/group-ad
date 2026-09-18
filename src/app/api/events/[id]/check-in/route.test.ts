import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    eventEnrollment: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-for-checkin';
const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/events/e1/check-in', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

const validToken = jwt.sign({ enrollmentId: 'en1', eventId: 'e1' }, SECRET);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/events/[id]/check-in', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 when no token is provided', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    const res = await POST(req({}) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('400 for an invalid/expired token', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    const res = await POST(req({ token: 'garbage' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('400 when the ticket is for a different event', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    const otherEventToken = jwt.sign({ enrollmentId: 'en1', eventId: 'other-event' }, SECRET);
    const res = await POST(req({ token: otherEventToken }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('403 when the caller is neither the organizer nor an admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user', userType: 'INDIVIDUAL' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('404 when the enrollment does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('400 when the enrollment is not APPROVED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({ status: 'PENDING', user: { name: 'Jane' } });
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('returns "Already checked in" without re-updating when already attended', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({
      status: 'APPROVED',
      attended: true,
      attendedAt: new Date(),
      user: { name: 'Jane' },
    });
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('Already checked in');
    expect(prisma.eventEnrollment.update).not.toHaveBeenCalled();
  });

  it('200 checks in an approved, not-yet-attended enrollee for the organizer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({
      status: 'APPROVED',
      attended: false,
      user: { name: 'Jane' },
    });
    (prisma.eventEnrollment.update as any).mockResolvedValue({});
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(prisma.eventEnrollment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ attended: true }) }),
    );
  });

  it('200 also allows an ADMIN who is not the organizer to check in', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue({ organizerId: 'organizer1' });
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({
      status: 'APPROVED',
      attended: false,
      user: { name: 'Jane' },
    });
    (prisma.eventEnrollment.update as any).mockResolvedValue({});
    const res = await POST(req({ token: validToken }) as any, ctx as any);
    expect(res.status).toBe(200);
  });
});
