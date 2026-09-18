import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    bookmark: { findUnique: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    post: { findUnique: vi.fn() },
  },
}));

import { GET, POST, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ postId: 'p1' }) };
const req = (method = 'GET') => new Request('http://localhost/api/bookmarks/p1', { method });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/bookmarks/[postId]', () => {
  it('returns isBookmarked=false without a DB lookup for an anonymous viewer', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.isBookmarked).toBe(false);
    expect(prisma.bookmark.findUnique).not.toHaveBeenCalled();
  });

  it('returns isBookmarked=true when a bookmark exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.bookmark.findUnique as any).mockResolvedValue({ id: 'bm1' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.isBookmarked).toBe(true);
  });
});

describe('POST /api/bookmarks/[postId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the post does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.findUnique as any).mockResolvedValue(null);
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(404);
    expect(prisma.bookmark.upsert).not.toHaveBeenCalled();
  });

  it('200 upserts the bookmark for an existing post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.findUnique as any).mockResolvedValue({ id: 'p1' });
    const res = await POST(req('POST') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.isBookmarked).toBe(true);
    expect(prisma.bookmark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_postId: { userId: 'u1', postId: 'p1' } } }),
    );
  });
});

describe('DELETE /api/bookmarks/[postId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req('DELETE') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('200 removes the bookmark', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await DELETE(req('DELETE') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.isBookmarked).toBe(false);
    expect(prisma.bookmark.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', postId: 'p1' } });
  });
});
