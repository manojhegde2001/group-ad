import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    postView: { findMany: vi.fn(), count: vi.fn() },
    post: { findMany: vi.fn() },
    event: { findMany: vi.fn() },
    company: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.postView.findMany as any).mockResolvedValue([]);
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.event.findMany as any).mockResolvedValue([]);
  (prisma.company.findMany as any).mockResolvedValue([]);
  (prisma.postView.count as any).mockResolvedValue(0);
});

describe('GET /api/analytics/business', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('403 for an INDIVIDUAL user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('200 returns trend, competitor, and summary data for a BUSINESS user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      userType: 'BUSINESS',
      companyId: 'c1',
      categoryId: 'cat1',
      company: { name: 'Acme Inc' },
      category: { name: 'Consulting' },
    });
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('trends');
    expect(json).toHaveProperty('summary');
    expect(json.summary.industryRank).toBe('Top 50%');
  });

  it('200 also allows an ADMIN account', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1',
      userType: 'ADMIN',
      companyId: null,
      categoryId: null,
      company: null,
      category: null,
    });
    const res = await GET();
    expect(res.status).toBe(200);
  });
});
