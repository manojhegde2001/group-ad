import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    eventEnrollment: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = () => new Request('http://localhost/api/events/e1/enrollments');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.eventEnrollment.findMany as any).mockResolvedValue([]);
});

describe('GET /api/events/[id]/enrollments', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    (prisma.event.findUnique as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the caller is neither the organizer nor an admin', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'random-user' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', organizerId: 'organizer1' });
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.eventEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('200 lets the organizer list enrollments', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'organizer1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', organizerId: 'organizer1' });
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([{ id: 'en1' }]);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.enrollments).toHaveLength(1);
  });

  it('200 lets an ADMIN who is not the organizer list enrollments', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', organizerId: 'organizer1' });
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(200);
  });
});
