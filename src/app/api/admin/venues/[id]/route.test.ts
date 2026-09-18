import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    venue: { delete: vi.fn() },
  },
}));

import { DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'v1' }) };
const req = () => new Request('http://localhost/api/admin/venues/v1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('DELETE /api/admin/venues/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(req() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'BUSINESS' });
    const res = await DELETE(req() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.venue.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the venue for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1' } });
    (prisma.user.findUnique as any).mockResolvedValue({ userType: 'ADMIN' });
    const res = await DELETE(req() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.venue.delete).toHaveBeenCalledWith({ where: { id: 'v1' } });
  });
});
