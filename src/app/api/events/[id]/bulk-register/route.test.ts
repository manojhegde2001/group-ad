import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    event: { findUnique: vi.fn() },
    user: { findMany: vi.fn() },
    eventEnrollment: { create: vi.fn() },
  },
}));

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'e1' }) };
const req = (body: unknown) =>
  new Request('http://localhost/api/events/e1/bulk-register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/events/[id]/bulk-register', () => {
  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await POST(req({ participants: [{ email: 'a@example.com' }] }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('400 for an empty participants list', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await POST(req({ participants: [] }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the event does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue(null);
    const res = await POST(req({ participants: [{ email: 'a@example.com' }] }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('registers a matched, not-yet-enrolled user as APPROVED', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue({ id: 'e1', maxAttendees: null, enrollments: [] });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1', email: 'a@example.com', username: null }]);
    const res = await POST(req({ participants: [{ email: 'a@example.com' }] }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.successCount).toBe(1);
    expect(prisma.eventEnrollment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', status: 'APPROVED' }) }),
    );
  });

  it('skips users who are unknown or already enrolled', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue({
      id: 'e1',
      maxAttendees: null,
      enrollments: [{ userId: 'u2' }],
    });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u2', email: 'already@example.com', username: null }]);
    const res = await POST(
      req({ participants: [{ email: 'unknown@example.com' }, { email: 'already@example.com' }] }) as any,
      ctx as any,
    );
    const json = await res.json();
    expect(json.successCount).toBe(0);
    expect(json.failedList).toHaveLength(2);
    expect(prisma.eventEnrollment.create).not.toHaveBeenCalled();
  });

  it('stops registering once the event reaches capacity', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.event.findUnique as any).mockResolvedValue({
      id: 'e1',
      maxAttendees: 1,
      enrollments: [{ userId: 'existing' }],
    });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1', email: 'a@example.com', username: null }]);
    const res = await POST(req({ participants: [{ email: 'a@example.com' }] }) as any, ctx as any);
    const json = await res.json();
    expect(json.successCount).toBe(0);
    expect(json.failedList[0]).toContain('Event full');
    expect(prisma.eventEnrollment.create).not.toHaveBeenCalled();
  });
});
