import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    block: { findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    connection: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const postReq = (body: unknown) =>
  new Request('http://localhost/api/blocks', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/blocks', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ blockedId: 'u2' }) as any);
    expect(res.status).toBe(401);
  });

  it('400 when blockedId is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({}) as any);
    expect(res.status).toBe(400);
  });

  it('400 when blocking self', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({ blockedId: 'u1' }) as any);
    expect(res.status).toBe(400);
  });

  it('returns a message without creating a duplicate when already blocked', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findUnique as any).mockResolvedValue({ id: 'b1' });
    const res = await POST(postReq({ blockedId: 'u2' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('User already blocked');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates the block and removes any existing connection', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findUnique as any).mockResolvedValue(null);
    (prisma.$transaction as any).mockResolvedValue([{ id: 'b1' }, { count: 1 }]);
    const res = await POST(postReq({ blockedId: 'u2' }) as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.message).toBe('User blocked successfully');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});

describe('GET /api/blocks', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 lists the user's blocked users", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.block.findMany as any).mockResolvedValue([{ id: 'b1', blocked: { id: 'u2' } }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(prisma.block.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { blockerId: 'u1' } }),
    );
  });
});
