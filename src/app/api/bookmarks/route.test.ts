import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/bookmarks${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/bookmarks', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it("200 lists the current user's bookmarked posts with pagination", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.bookmark.findMany as any).mockResolvedValue([
      { createdAt: new Date(), post: { id: 'p1', postLikes: [{ userId: 'u1' }] } },
    ]);
    (prisma.bookmark.count as any).mockResolvedValue(1);
    const res = await GET(req('?page=1&limit=20') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.posts[0].isBookmarked).toBe(true);
    expect(json.posts[0].isLikedByUser).toBe(true);
    expect(json.pagination.total).toBe(1);
  });
});
