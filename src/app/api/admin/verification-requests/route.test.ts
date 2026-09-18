import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    userTypeChangeRequest: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/admin/verification-requests');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.userTypeChangeRequest.findMany as any).mockResolvedValue([]);
  (prisma.userTypeChangeRequest.count as any).mockResolvedValue(0);
});

describe('GET /api/admin/verification-requests', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
    expect(prisma.userTypeChangeRequest.findMany).not.toHaveBeenCalled();
  });

  it('200 returns pending requests with stats for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('requests');
    expect(json).toHaveProperty('stats');
  });

  it('uses a fallback average response time when no requests have been reviewed yet', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.stats.avgResponseTime).toBe(1.5);
    expect(json.stats.successRate).toBe(98.2);
  });

  it('computes real stats from reviewed requests when present', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const created = new Date('2026-01-01T00:00:00Z');
    const reviewed = new Date('2026-01-01T02:00:00Z');
    (prisma.userTypeChangeRequest.findMany as any)
      .mockResolvedValueOnce([]) // requests list
      .mockResolvedValueOnce([{ createdAt: created, reviewedAt: reviewed }]); // reviewedRequests
    (prisma.userTypeChangeRequest.count as any)
      .mockResolvedValueOnce(0) // total pending
      .mockResolvedValueOnce(1) // approvedCount
      .mockResolvedValueOnce(1); // totalReviewedCount
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.stats.avgResponseTime).toBe(2);
    expect(json.stats.successRate).toBe(100);
  });
});
