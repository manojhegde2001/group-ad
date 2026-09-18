import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    block: { findMany: vi.fn() },
    post: { findMany: vi.fn() },
    event: { findMany: vi.fn() },
    company: { findMany: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({ success: true, resetAt: 0 })),
  getClientIp: vi.fn(() => '127.0.0.1'),
  rateLimitResponse: vi.fn(() => NextResponse.json({ error: 'Too many requests' }, { status: 429 })),
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';

const req = (qs = '') => new Request(`http://localhost/api/search${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  (rateLimit as any).mockReturnValue({ success: true, resetAt: 0 });
  (auth as any).mockResolvedValue(null);
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.event.findMany as any).mockResolvedValue([]);
  (prisma.company.findMany as any).mockResolvedValue([]);
});

describe('GET /api/search', () => {
  it('429 when rate-limited', async () => {
    (rateLimit as any).mockReturnValue({ success: false, resetAt: Date.now() + 1000 });
    const res = await GET(req('?q=hello') as any);
    expect(res.status).toBe(429);
  });

  it('returns an empty result set for a query under 2 characters', async () => {
    const res = await GET(req('?q=a') as any);
    const json = await res.json();
    expect(json.results).toEqual([]);
    expect(prisma.post.findMany).not.toHaveBeenCalled();
  });

  it('returns an empty result set when q is missing', async () => {
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.results).toEqual([]);
  });

  it('excludes blocked users’ posts for an authenticated viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findMany as any).mockResolvedValue([{ blockerId: 'u1', blockedId: 'blocked1' }]);
    await GET(req('?q=hello') as any);
    expect(prisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: { notIn: ['blocked1'] } }) }),
    );
  });

  it('combines posts, events, and companies (with at least one user) into results', async () => {
    (prisma.post.findMany as any).mockResolvedValue([
      { id: 'p1', content: 'hello world', images: ['img.png'], user: { name: 'Jane', username: 'jane' } },
    ]);
    (prisma.event.findMany as any).mockResolvedValue([
      { id: 'e1', title: 'Hello Meetup', slug: 'hello-meetup', startDate: new Date(), city: 'Pune' },
    ]);
    (prisma.company.findMany as any).mockResolvedValue([
      { id: 'c1', name: 'Hello Inc', location: 'Pune', logo: null, users: [{ username: 'owner' }] },
      { id: 'c2', name: 'Hello Empty Co', location: null, logo: null, users: [] },
    ]);
    const res = await GET(req('?q=hello') as any);
    const json = await res.json();
    expect(json.results).toHaveLength(3);
    expect(json.results.map((r: any) => r.type)).toEqual(['post', 'event', 'company']);
  });
});
