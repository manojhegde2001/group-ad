import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
    eventEnrollment: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const getReq = (qs = '') => new Request(`http://localhost/api/events${qs}`);
const validEventBody = {
  title: 'Networking Night',
  description: 'A great meetup for professionals',
  startDate: new Date(Date.now() + 86_400_000).toISOString(),
  endDate: new Date(Date.now() + 90_000_000).toISOString(),
};
const postReq = (body: unknown) =>
  new Request('http://localhost/api/events', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.event.findMany as any).mockResolvedValue([]);
  (prisma.event.count as any).mockResolvedValue(0);
});

describe('GET /api/events', () => {
  it('200 scopes non-admins to PUBLISHED events', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any);
    expect(res.status).toBe(200);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } }),
    );
  });

  it('lets an ADMIN see all statuses with ?all=true', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    await GET(getReq('?all=true') as any);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('does not let a non-admin bypass the PUBLISHED filter even with ?all=true', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    await GET(getReq('?all=true') as any);
    expect(prisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'PUBLISHED' } }),
    );
  });

  it('annotates events with the current user’s enrollment status', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findMany as any).mockResolvedValue([{ id: 'e1', maxAttendees: 10, currentAttendees: 3 }]);
    (prisma.event.count as any).mockResolvedValue(1);
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([{ eventId: 'e1', status: 'APPROVED' }]);
    const res = await GET(getReq() as any);
    const json = await res.json();
    expect(json.events[0].isEnrolled).toBe(true);
    expect(json.events[0].enrollmentStatus).toBe('APPROVED');
    expect(json.events[0].seatsLeft).toBe(7);
  });
});

describe('POST /api/events', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq(validEventBody) as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS' });
    const res = await POST(postReq(validEventBody) as any);
    expect(res.status).toBe(403);
    expect(prisma.event.create).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'admin1', userType: 'ADMIN' });
    const res = await POST(postReq({ ...validEventBody, title: 'ab' }) as any);
    expect(res.status).toBe(400);
  });

  it('201 creates the event with a slug and organizerId set to the admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'admin1', userType: 'ADMIN' });
    (prisma.event.create as any).mockResolvedValue({ id: 'e1', title: validEventBody.title });
    const res = await POST(postReq(validEventBody) as any);
    expect(res.status).toBe(201);
    expect(prisma.event.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizerId: 'admin1', slug: expect.any(String) }),
      }),
    );
  });
});
