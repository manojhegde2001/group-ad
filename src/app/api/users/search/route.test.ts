import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/users/search${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findMany as any).mockResolvedValue([]);
});

describe('GET /api/users/search', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req('?q=jane') as any);
    expect(res.status).toBe(401);
  });

  it('returns an empty list for a query under 2 characters', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await GET(req('?q=a') as any);
    const json = await res.json();
    expect(json.users).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('excludes self and any user with a block relationship', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    await GET(req('?q=jane') as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { id: { not: 'u1' } },
            { blocksReceived: { none: { blockerId: 'u1' } } },
            { blocksSent: { none: { blockedId: 'u1' } } },
          ]),
        }),
      }),
    );
  });
});
