import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    profileView: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.profileView.findMany as any).mockResolvedValue([]);
  (prisma.profileView.count as any).mockResolvedValue(0);
  (prisma.profileView.groupBy as any).mockResolvedValue([]);
});

describe('GET /api/analytics/profile', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('200 scopes profile views to the current user and computes engagement', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.profileView.count as any).mockResolvedValue(10);
    (prisma.profileView.groupBy as any).mockResolvedValue([{ viewerId: 'v1' }, { viewerId: 'v2' }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.summary).toEqual({ totalViews: 10, uniqueViewers: 2, engagement: '20.0' });
    expect(prisma.profileView.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ viewedId: 'u1' }) }),
    );
  });

  it('engagement is 0 when there are no views', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await GET();
    const json = await res.json();
    expect(json.summary.engagement).toBe(0);
  });
});
