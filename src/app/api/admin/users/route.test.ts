import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/admin/users${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/users', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('200 lists users with pagination for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1' }]);
    (prisma.user.count as any).mockResolvedValue(1);
    const res = await GET(req('?page=1&limit=50') as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
    expect(json.pages).toBe(1);
  });

  it('filters by userType when a type query param is given', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([]);
    (prisma.user.count as any).mockResolvedValue(0);
    await GET(req('?type=BUSINESS') as any);
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userType: 'BUSINESS' }) }),
    );
  });
});
