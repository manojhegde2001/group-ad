import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findFirst: vi.fn(), update: vi.fn() },
    eventEnrollment: { findUnique: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}));

import { GET, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const getReq = () => new Request('http://localhost/api/events/e1');
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/events/e1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/events/e1', { method: 'DELETE' });

const publishedEvent = { id: 'e1', status: 'PUBLISHED', maxAttendees: null, currentAttendees: 0, categoryLimits: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/events/[id]', () => {
  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.event.findFirst as any).mockResolvedValue(null);
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('404 for a non-admin viewer when the event is not PUBLISHED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    (prisma.event.findFirst as any).mockResolvedValue({ ...publishedEvent, status: 'DRAFT' });
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 lets an ADMIN view a non-PUBLISHED event', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findFirst as any).mockResolvedValue({ ...publishedEvent, status: 'DRAFT' });
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(200);
  });

  it('200 includes the enrollment status for an authenticated viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.event.findFirst as any).mockResolvedValue(publishedEvent);
    (prisma.eventEnrollment.findUnique as any).mockResolvedValue({ id: 'en1', status: 'APPROVED' });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL', categoryId: null });
    const res = await GET(getReq() as any, ctx as any);
    const json = await res.json();
    expect(json.userEnrollment.status).toBe('APPROVED');
  });
});

describe('PATCH /api/events/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ title: 'New Title Here' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    const res = await PATCH(patchReq({ title: 'New Title Here' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('200 updates the event for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    (prisma.event.update as any).mockResolvedValue({ id: 'e1', title: 'New Title Here' });
    const res = await PATCH(patchReq({ title: 'New Title Here' }) as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/events/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'INDIVIDUAL' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.event.update).not.toHaveBeenCalled();
  });

  it('200 soft-deletes the event by setting status=CANCELLED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.event.update).toHaveBeenCalledWith({
      where: { id: 'e1' },
      data: { status: 'CANCELLED' },
    });
  });
});
