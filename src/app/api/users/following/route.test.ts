import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/users/following');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/users/following', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it('200 flattens the following relation into a plain user list', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({
      following: [{ following: { id: 'u2', name: 'U2' } }, { following: { id: 'u3', name: 'U3' } }],
    });
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.users).toEqual([{ id: 'u2', name: 'U2' }, { id: 'u3', name: 'U3' }]);
  });

  it('200 returns an empty list when the user record has no following relation', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.users).toEqual([]);
  });
});
