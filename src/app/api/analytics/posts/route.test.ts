import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    postView: { findMany: vi.fn() },
    postLike: { findMany: vi.fn(), count: vi.fn() },
    postComment: { findMany: vi.fn() },
    post: { findMany: vi.fn(), aggregate: vi.fn(), count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.postView.findMany as any).mockResolvedValue([]);
  (prisma.postLike.findMany as any).mockResolvedValue([]);
  (prisma.postComment.findMany as any).mockResolvedValue([]);
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.post.aggregate as any).mockResolvedValue({ _sum: { views: 0 } });
  (prisma.postLike.count as any).mockResolvedValue(0);
  (prisma.post.count as any).mockResolvedValue(0);
});

describe('GET /api/analytics/posts', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 returns trends, top posts, and a summary for the current user's posts", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.aggregate as any).mockResolvedValue({ _sum: { views: 100 } });
    (prisma.postLike.count as any).mockResolvedValue(20);
    (prisma.post.count as any).mockResolvedValue(4);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.summary).toEqual({ totalReach: 100, totalPosts: 4, avgLikes: '5.0' });
  });

  it('avgLikes is 0 when the user has no posts', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await GET();
    const json = await res.json();
    expect(json.summary.avgLikes).toBe(0);
  });
});
