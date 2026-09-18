import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    follow: {
      count: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));

import { GET, POST, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification-service';

const ctx = { params: Promise.resolve({ id: 'target1' }) };
const req = (method = 'GET') => new Request('http://localhost/api/users/target1/follow', { method });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.follow.count as any).mockResolvedValue(0);
});

describe('GET /api/users/[id]/follow', () => {
  it('returns follow status and counts for an authenticated viewer', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.follow.count as any).mockResolvedValueOnce(3).mockResolvedValueOnce(5);
    (prisma.follow.findUnique as any).mockResolvedValue({ id: 'f1' });
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ isFollowing: true, followerCount: 3, followingCount: 5 });
  });

  it('returns isFollowing=false without querying a follow record for an anonymous viewer', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any, ctx as any);
    const json = await res.json();
    expect(json.isFollowing).toBe(false);
    expect(prisma.follow.findUnique).not.toHaveBeenCalled();
  });
});

describe('POST /api/users/[id]/follow', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 when following self', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'target1' } });
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the target user does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(404);
    expect(prisma.follow.upsert).not.toHaveBeenCalled();
  });

  it('201-equivalent 200 upserts the follow and notifies the target user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any)
      .mockResolvedValueOnce({ id: 'target1', name: 'Target' })
      .mockResolvedValueOnce({ name: 'U One', username: 'u_one' });
    (prisma.follow.count as any).mockResolvedValue(7);
    const res = await POST(req('POST') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ message: 'Followed successfully', isFollowing: true, followerCount: 7 });
    expect(prisma.follow.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { followerId_followingId: { followerId: 'u1', followingId: 'target1' } },
      }),
    );
    expect(notificationService.create).toHaveBeenCalled();
  });
});

describe('DELETE /api/users/[id]/follow', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req('DELETE') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('200 removes the follow relationship', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.follow.count as any).mockResolvedValue(2);
    const res = await DELETE(req('DELETE') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ message: 'Unfollowed successfully', isFollowing: false, followerCount: 2 });
    expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
      where: { followerId: 'u1', followingId: 'target1' },
    });
  });
});
