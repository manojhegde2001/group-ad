import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), groupBy: vi.fn(), count: vi.fn() },
    post: { findMany: vi.fn(), count: vi.fn() },
    postLike: { findMany: vi.fn() },
    event: { findMany: vi.fn(), count: vi.fn() },
    category: { findMany: vi.fn() },
    eventEnrollment: { count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findMany as any).mockResolvedValue([]);
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.postLike.findMany as any).mockResolvedValue([]);
  (prisma.user.groupBy as any).mockResolvedValue([]);
  (prisma.event.findMany as any).mockResolvedValue([]);
  (prisma.category.findMany as any).mockResolvedValue([]);
  (prisma.user.count as any).mockResolvedValue(0);
  (prisma.post.count as any).mockResolvedValue(0);
  (prisma.event.count as any).mockResolvedValue(0);
  (prisma.eventEnrollment.count as any).mockResolvedValue(0);
});

describe('GET /api/admin/analytics', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('200 returns trends, distribution, top content, and summary for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.groupBy as any).mockResolvedValue([{ userType: 'BUSINESS', _count: { id: 3 } }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.distribution.users).toEqual({ BUSINESS: 3 });
    expect(json).toHaveProperty('topContent');
    expect(json).toHaveProperty('summary');
  });
});
