import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    postLike: { create: vi.fn(), delete: vi.fn() },
    post: { update: vi.fn() },
  },
}));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { POST, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';
import { notificationService } from '@/services/notification-service';

const ctx = { params: Promise.resolve({ id: 'p1' }) };
const req = (method: string) => new Request('http://localhost/api/posts/p1/like', { method });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('POST /api/posts/[id]/like', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(429);
    expect(prisma.postLike.create).not.toHaveBeenCalled();
  });

  it('likes the post and notifies a different owner', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (prisma.postLike.create as any).mockResolvedValue({ postId: 'p1', userId: 'u1' });
    (prisma.post.update as any).mockResolvedValue({ userId: 'owner1' });
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(200);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner1', type: 'POST_LIKE' }),
    );
  });

  it('skips the notification when liking your own post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1', name: 'Owner' } });
    (prisma.postLike.create as any).mockResolvedValue({ postId: 'p1', userId: 'owner1' });
    (prisma.post.update as any).mockResolvedValue({ userId: 'owner1' });
    const res = await POST(req('POST') as any, ctx as any);
    expect(res.status).toBe(200);
    expect(notificationService.create).not.toHaveBeenCalled();
  });

  it('is idempotent when the like already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.postLike.create as any).mockRejectedValue(new Error('Unique constraint failed'));
    const res = await POST(req('POST') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('Liked');
    expect(prisma.post.update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/posts/[id]/like', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req('DELETE') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('unlikes the post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.postLike.delete as any).mockResolvedValue({});
    (prisma.post.update as any).mockResolvedValue({});
    const res = await DELETE(req('DELETE') as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('Unliked');
    expect(prisma.postLike.delete).toHaveBeenCalledWith({
      where: { postId_userId: { postId: 'p1', userId: 'u1' } },
    });
  });

  it('is idempotent when there was no existing like', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.postLike.delete as any).mockRejectedValue(new Error('Record to delete does not exist'));
    const res = await DELETE(req('DELETE') as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });
});
