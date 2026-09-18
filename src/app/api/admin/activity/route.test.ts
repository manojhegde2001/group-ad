import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { findMany: vi.fn(), count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/admin/activity');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.post.findMany as any).mockResolvedValue([]);
  (prisma.post.count as any).mockResolvedValue(0);
});

describe('GET /api/admin/activity', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await GET(req() as any);
    expect(res.status).toBe(403);
  });

  it('200 lists recent posts with pagination for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.post.findMany as any).mockResolvedValue([{ id: 'p1' }]);
    (prisma.post.count as any).mockResolvedValue(1);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.total).toBe(1);
  });
});
