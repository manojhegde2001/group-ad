import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/posts/my-posts');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/posts/my-posts', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it("200 scopes the query to the current user's posts", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.findMany as any).mockResolvedValue([
      { id: 'p1', likes: null, _count: { postLikes: 2, postComments: 1 } },
    ]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
    expect(json.posts[0].likes).toBe(0);
  });
});
