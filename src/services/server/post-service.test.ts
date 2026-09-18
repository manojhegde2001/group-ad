import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: any[]) => any) => fn,
}));
vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findMany: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    block: { findMany: vi.fn() },
    category: { findUnique: vi.fn() },
  },
}));

import { getPostsServer } from './post-service';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.post.count as any).mockResolvedValue(0);
  (prisma.block.findMany as any).mockResolvedValue([]);
});

describe('getPostsServer', () => {
  it('defaults to PUBLIC visibility for an anonymous, non-profile query', async () => {
    (auth as any).mockResolvedValue(null);
    await getPostsServer({});
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ visibility: 'PUBLIC' }) }),
    );
  });

  it('excludes blocked users’ posts for an authenticated viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findMany as any).mockResolvedValue([{ blockerId: 'u1', blockedId: 'blocked1' }]);
    await getPostsServer({});
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: { notIn: ['blocked1'] } }) }),
    );
  });

  it('returns an empty page early when the requested username does not resolve to a user', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const result = await getPostsServer({ username: 'ghost' });
    expect(result.posts).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it('shows only PUBLIC posts when viewing someone else’s profile', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'owner1' });
    await getPostsServer({ username: 'jane' });
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ visibility: 'PUBLIC', userId: 'owner1' }) }),
    );
  });

  it('omits the visibility filter entirely when viewing your own profile (shows PRIVATE too)', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'owner1' });
    await getPostsServer({ username: 'jane' });
    const call = (prisma.post.findMany as any).mock.calls[0][0];
    expect(call.where.visibility).toBeUndefined();
    expect(call.where.userId).toBe('owner1');
  });

  it('returns an empty page early when a userId filter collides with the blocked-user exclusion', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.block.findMany as any).mockResolvedValue([{ blockerId: 'viewer1', blockedId: 'blocked1' }]);
    const result = await getPostsServer({ userId: 'blocked1' });
    expect(result.posts).toEqual([]);
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it('expands categoryId into an OR match on user category and post tags when the category exists', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.category.findUnique as any).mockResolvedValue({ name: 'Doctors', slug: 'doctors' });
    await getPostsServer({ categoryId: 'cat1' });
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            { user: { categoryId: 'cat1' } },
            { tags: { has: 'doctors' } },
          ]),
        }),
      }),
    );
  });

  it('marks isLikedByUser/isSaved false for an anonymous viewer and routes through the cached path', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.post.findMany as any).mockResolvedValue([{ id: 'p1' }]);
    (prisma.post.count as any).mockResolvedValue(1);
    const result = await getPostsServer({});
    expect(result.posts[0].isLikedByUser).toBe(false);
    expect(result.posts[0].isSaved).toBe(false);
  });

  it('derives isLikedByUser/isSaved from join data for an authenticated viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.findMany as any).mockResolvedValue([
      { id: 'p1', postLikes: [{ userId: 'u1' }], boardPosts: [{ id: 'bp1' }] },
    ]);
    (prisma.post.count as any).mockResolvedValue(1);
    const result = await getPostsServer({});
    expect(result.posts[0].isLikedByUser).toBe(true);
    expect(result.posts[0].isSaved).toBe(true);
  });

  it('computes pagination.totalPages from total and limit', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.post.count as any).mockResolvedValue(45);
    const result = await getPostsServer({ limit: 20 });
    expect(result.pagination.totalPages).toBe(3);
  });
});
