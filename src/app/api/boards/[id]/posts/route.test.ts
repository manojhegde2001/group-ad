import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    board: { findFirst: vi.fn() },
    boardPost: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { POST, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'b1' }) };
const postReq = (body: unknown) =>
  new Request('http://localhost/api/boards/b1/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = (qs = '') => new Request(`http://localhost/api/boards/b1/posts${qs}`, { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/boards/[id]/posts', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ postId: 'p1' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 when postId is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({}) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the board is not owned by the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue(null);
    const res = await POST(postReq({ postId: 'p1' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('returns a message without duplicating when the post is already in the board', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    (prisma.boardPost.findFirst as any).mockResolvedValue({ id: 'bp1' });
    const res = await POST(postReq({ postId: 'p1' }) as any, ctx as any);
    const json = await res.json();
    expect(json.message).toBe('Post is already in this board');
    expect(prisma.boardPost.create).not.toHaveBeenCalled();
  });

  it('adds the post to the board', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    (prisma.boardPost.findFirst as any).mockResolvedValue(null);
    (prisma.boardPost.create as any).mockResolvedValue({ id: 'bp1' });
    const res = await POST(postReq({ postId: 'p1' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.boardPost.create).toHaveBeenCalled();
  });
});

describe('DELETE /api/boards/[id]/posts', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq('?postId=p1') as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 when postId is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the board is not owned by the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq('?postId=p1') as any, ctx as any);
    expect(res.status).toBe(404);
    expect(prisma.boardPost.deleteMany).not.toHaveBeenCalled();
  });

  it('200 removes the post from the board', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    const res = await DELETE(deleteReq('?postId=p1') as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.boardPost.deleteMany).toHaveBeenCalledWith({
      where: { boardId: 'b1', postId: 'p1' },
    });
  });
});
