import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    board: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { GET, PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'b1' }) };
const getReq = () => new Request('http://localhost/api/boards/b1');
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/boards/b1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/boards/b1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/boards/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the board does not belong to the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue(null);
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it("200 returns the owner's board", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    const res = await GET(getReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.board.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'b1', userId: 'u1' } }),
    );
  });
});

describe('PATCH /api/boards/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('400 for an empty name', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await PATCH(patchReq({ name: '' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it('404 when the board is not owned by the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New' }) as any, ctx as any);
    expect(res.status).toBe(404);
    expect(prisma.board.update).not.toHaveBeenCalled();
  });

  it('200 renames the board', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    (prisma.board.update as any).mockResolvedValue({ id: 'b1', name: 'New' });
    const res = await PATCH(patchReq({ name: 'New' }) as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/boards/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the board is not owned by the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
    expect(prisma.board.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the board', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findFirst as any).mockResolvedValue({ id: 'b1', userId: 'u1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.board.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
  });
});
