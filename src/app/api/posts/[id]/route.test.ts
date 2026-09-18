import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    postView: { findFirst: vi.fn(), create: vi.fn() },
    connection: { findFirst: vi.fn(), findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { GET, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'p1' }) };
const getReq = () => new Request('http://localhost/api/posts/p1');
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/posts/p1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/posts/p1', { method: 'DELETE' });

const basePost = {
  id: 'p1',
  userId: 'owner1',
  user: { id: 'owner1', name: 'Owner' },
  _count: { postLikes: 0, postComments: 0 },
};

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.postView.findFirst as any).mockResolvedValue(null);
  (prisma.postView.create as any).mockResolvedValue({});
  (prisma.post.update as any).mockResolvedValue({});
});

describe('GET /api/posts/[id]', () => {
  it('404 when the post does not exist', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.post.findUnique as any).mockResolvedValue(null);
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 returns the post for an anonymous viewer without a connection lookup', async () => {
    (auth as any).mockResolvedValue(null);
    (prisma.post.findUnique as any).mockResolvedValue(basePost);
    const res = await GET(getReq() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.post.id).toBe('p1');
    expect(prisma.connection.findFirst).not.toHaveBeenCalled();
  });

  it('200 includes connection status for an authenticated viewer viewing another user’s post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'viewer1' } });
    (prisma.post.findUnique as any).mockResolvedValue(basePost);
    (prisma.connection.findFirst as any).mockResolvedValue({ status: 'ACCEPTED', requesterId: 'viewer1' });
    (prisma.connection.findMany as any).mockResolvedValue([]);
    const res = await GET(getReq() as any, ctx as any);
    const json = await res.json();
    expect(json.post.user.connectionStatus).toBe('ACCEPTED');
    expect(json.post.user.connectionInitiator).toBe(true);
  });
});

describe('PATCH /api/posts/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ content: 'updated' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the post does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1' } });
    (prisma.post.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ content: 'updated' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the current user is not the post owner', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'someone-else' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    const res = await PATCH(patchReq({ content: 'updated' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    const res = await PATCH(patchReq({ content: '' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('200 updates the post for its owner', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    (prisma.post.update as any).mockResolvedValue({ id: 'p1', content: 'updated' });
    const res = await PATCH(patchReq({ content: 'updated' }) as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/posts/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the post does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1' } });
    (prisma.post.findUnique as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when a non-owner, non-admin user tries to delete', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'someone-else', userType: 'INDIVIDUAL' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it('200 allows the owner to delete their post', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'owner1', userType: 'INDIVIDUAL' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
  });

  it('200 allows an ADMIN to delete a post they do not own', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.post.findUnique as any).mockResolvedValue({ userId: 'owner1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
  });
});
