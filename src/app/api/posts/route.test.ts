import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    post: { create: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));
vi.mock('@/services/server/post-service', () => ({ getPostsServer: vi.fn() }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';
import { getPostsServer } from '@/services/server/post-service';

const req = () =>
  new Request('http://localhost/api/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'TEXT', content: 'a valid post body' }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('GET /api/posts', () => {
  it('200 delegates to getPostsServer with parsed query params', async () => {
    (getPostsServer as any).mockResolvedValue({ posts: [], total: 0 });
    const res = await GET(new Request('http://localhost/api/posts?page=2&limit=10&categoryId=c1') as any);
    expect(res.status).toBe(200);
    expect(getPostsServer).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, limit: 10, categoryId: 'c1' }),
    );
  });

  it('500 when getPostsServer throws', async () => {
    (getPostsServer as any).mockRejectedValue(new Error('db down'));
    const res = await GET(new Request('http://localhost/api/posts') as any);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/posts', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req() as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(NextResponse.json({ error: 'Too many requests' }, { status: 429 }));
    const res = await POST(req() as any);
    expect(res.status).toBe(429);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('403 for an INDIVIDUAL user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'INDIVIDUAL' });
    const res = await POST(req() as any);
    expect(res.status).toBe(403);
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('201 for a BUSINESS user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', userType: 'BUSINESS', companyId: null, categoryId: 'c1' });
    (prisma.post.create as any).mockResolvedValue({ id: 'p1', _count: { postLikes: 0, postComments: 0 } });
    const res = await POST(req() as any);
    expect(res.status).toBe(201);
    expect(prisma.post.create).toHaveBeenCalled();
  });

  const reqWithCompany = (companyId: string) =>
    new Request('http://localhost/api/posts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'TEXT', content: 'a valid post body', companyId }),
    });

  it("403 when posting on behalf of a company the user doesn't belong to", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u1',
      userType: 'BUSINESS',
      companyId: 'other-company',
      categoryId: 'c1',
    });
    const res = await POST(reqWithCompany('c1') as any);
    expect(res.status).toBe(403);
    expect(prisma.post.create).not.toHaveBeenCalled();
  });

  it('201 lets an ADMIN post on behalf of any company', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'admin1',
      userType: 'ADMIN',
      companyId: null,
      categoryId: null,
    });
    (prisma.post.create as any).mockResolvedValue({ id: 'p1', _count: { postLikes: 0, postComments: 0 } });
    const res = await POST(reqWithCompany('c1') as any);
    expect(res.status).toBe(201);
  });
});
