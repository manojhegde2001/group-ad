import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { count: vi.fn(), findMany: vi.fn() },
    post: { count: vi.fn(), findMany: vi.fn() },
    event: { count: vi.fn() },
    userTypeChangeRequest: { count: vi.fn() },
    report: { count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.count as any).mockResolvedValue(0);
  (prisma.post.count as any).mockResolvedValue(0);
  (prisma.event.count as any).mockResolvedValue(0);
  (prisma.userTypeChangeRequest.count as any).mockResolvedValue(0);
  (prisma.report.count as any).mockResolvedValue(0);
  (prisma.user.findMany as any).mockResolvedValue([]);
  (prisma.post.findMany as any).mockResolvedValue([]);
});

describe('GET /api/admin/stats', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('200 returns stats with a 0% trend when there is no prior-period data', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.stats.trends.users).toBe('0%');
  });

  it('computes a +100% trend when there is current activity but no prior activity', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.count as any)
      .mockResolvedValueOnce(10) // totalUsers
      .mockResolvedValueOnce(3) // businessUsers
      .mockResolvedValueOnce(7) // individualUsers
      .mockResolvedValueOnce(5) // usersLast30
      .mockResolvedValueOnce(0); // usersPrior30
    const res = await GET();
    const json = await res.json();
    expect(json.stats.trends.users).toBe('+100%');
  });
});
