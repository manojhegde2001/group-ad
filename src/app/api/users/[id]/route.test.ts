import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    post: { count: vi.fn() },
    follow: { count: vi.fn(), findUnique: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'target1' }) };
const req = () => new Request('http://localhost/api/users/target1');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.follow.count as any).mockResolvedValue(0);
  (prisma.post.count as any).mockResolvedValue(0);
});

describe('GET /api/users/[id]', () => {
  it('404 when the user does not exist', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 returns the public profile with follow/post counts, isFollowing=false for an anonymous viewer', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'target1', name: 'Target' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.user.isFollowing).toBe(false);
    expect(prisma.follow.findUnique).not.toHaveBeenCalled();
  });

  it('200 sets isFollowing=true when a follow record exists for the viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'target1', name: 'Target' });
    (prisma.follow.findUnique as any).mockResolvedValue({ id: 'f1' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.user.isFollowing).toBe(true);
  });
});
