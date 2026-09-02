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

import { POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

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
});
