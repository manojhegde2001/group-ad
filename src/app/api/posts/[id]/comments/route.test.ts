import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    postComment: { findMany: vi.fn(), create: vi.fn() },
    post: { findUnique: vi.fn() },
  },
}));
vi.mock('@/services/notification-service', () => ({ notificationService: { create: vi.fn() } }));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';
import { notificationService } from '@/services/notification-service';

const ctx = { params: Promise.resolve({ id: 'p1' }) };
const getReq = () => new Request('http://localhost/api/posts/p1/comments');
const postReq = (body: unknown) =>
  new Request('http://localhost/api/posts/p1/comments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('GET /api/posts/[id]/comments', () => {
  it('200 lists comments for a post (no auth required)', async () => {
    (prisma.postComment.findMany as any).mockResolvedValue([{ id: 'c1' }]);
    const res = await GET(getReq() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.comments).toHaveLength(1);
  });
});

describe('POST /api/posts/[id]/comments', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ content: 'nice post' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited, before touching the DB', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(postReq({ content: 'nice post' }) as any, ctx as any);
    expect(res.status).toBe(429);
    expect(prisma.post.findUnique).not.toHaveBeenCalled();
  });

  it('400 for an empty comment', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({ content: '' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the post does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.post.findUnique as any).mockResolvedValue(null);
    const res = await POST(postReq({ content: 'nice post' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('201 creates a comment and notifies a different post owner', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (prisma.post.findUnique as any).mockResolvedValue({ id: 'p1', userId: 'owner1' });
    (prisma.postComment.create as any).mockResolvedValue({ id: 'c1', content: 'nice post' });
    const res = await POST(postReq({ content: 'nice post' }) as any, ctx as any);
    expect(res.status).toBe(201);
    expect(notificationService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'owner1', type: 'POST_COMMENT' }),
    );
  });

  it('201 skips the notification when commenting on your own post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1', name: 'Owner' } });
    (prisma.post.findUnique as any).mockResolvedValue({ id: 'p1', userId: 'owner1' });
    (prisma.postComment.create as any).mockResolvedValue({ id: 'c1', content: 'nice post' });
    const res = await POST(postReq({ content: 'nice post' }) as any, ctx as any);
    expect(res.status).toBe(201);
    expect(notificationService.create).not.toHaveBeenCalled();
  });
});
