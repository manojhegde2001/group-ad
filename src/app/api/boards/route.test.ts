import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    board: { findMany: vi.fn(), create: vi.fn() },
  },
}));
vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: vi.fn(() => null) }));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limit';

const postReq = (body: unknown) =>
  new Request('http://localhost/api/boards', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  (enforceRateLimit as any).mockReturnValue(null);
});

describe('GET /api/boards', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("200 lists the current user's boards", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.findMany as any).mockResolvedValue([{ id: 'b1' }]);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.boards).toHaveLength(1);
    expect(prisma.board.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });
});

describe('POST /api/boards', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ name: 'Ideas' }) as any);
    expect(res.status).toBe(401);
  });

  it('429 when rate-limited', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (enforceRateLimit as any).mockReturnValue(new Response(null, { status: 429 }));
    const res = await POST(postReq({ name: 'Ideas' }) as any);
    expect(res.status).toBe(429);
    expect(prisma.board.create).not.toHaveBeenCalled();
  });

  it('400 for an empty board name', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await POST(postReq({ name: '' }) as any);
    expect(res.status).toBe(400);
  });

  it('200 creates a board owned by the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.board.create as any).mockResolvedValue({ id: 'b1', name: 'Ideas' });
    const res = await POST(postReq({ name: 'Ideas' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.board.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) }),
    );
  });
});
