import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    boardPost: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/boards/check${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/boards/check', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req('?postId=p1') as any);
    expect(res.status).toBe(401);
  });

  it('400 when postId is missing', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await GET(req() as any);
    expect(res.status).toBe(400);
  });

  it("200 returns the IDs of the user's boards containing the post", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.boardPost.findMany as any).mockResolvedValue([{ boardId: 'b1' }, { boardId: 'b2' }]);
    const res = await GET(req('?postId=p1') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.boardIds).toEqual(['b1', 'b2']);
    expect(prisma.boardPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: 'p1', board: { userId: 'u1' } } }),
    );
  });
});
