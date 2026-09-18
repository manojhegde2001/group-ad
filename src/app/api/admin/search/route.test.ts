import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findMany: vi.fn() },
    company: { findMany: vi.fn() },
    event: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/admin/search${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findMany as any).mockResolvedValue([]);
  (prisma.company.findMany as any).mockResolvedValue([]);
  (prisma.event.findMany as any).mockResolvedValue([]);
});

describe('GET /api/admin/search', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req('?q=jane') as any);
    expect(res.status).toBe(401);
  });

  it('401 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await GET(req('?q=jane') as any);
    expect(res.status).toBe(401);
  });

  it('returns an empty result set for a query under 2 characters', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await GET(req('?q=a') as any);
    const json = await res.json();
    expect(json.results).toEqual([]);
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('200 combines users, companies, and events into formatted results', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.findMany as any).mockResolvedValue([{ id: 'u1', name: 'Jane', username: 'jane', avatar: null, userType: 'INDIVIDUAL' }]);
    (prisma.company.findMany as any).mockResolvedValue([{ id: 'c1', name: 'Jane Co', logo: null, isVerified: true }]);
    (prisma.event.findMany as any).mockResolvedValue([{ id: 'e1', title: 'Jane Fest', slug: 'jane-fest', status: 'PUBLISHED' }]);
    const res = await GET(req('?q=jane') as any);
    const json = await res.json();
    expect(json.results).toHaveLength(3);
    expect(json.results.map((r: any) => r.type)).toEqual(['user', 'business', 'event']);
  });
});
