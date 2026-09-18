import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    company: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/companies${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/companies', () => {
  it('200 lists all companies with no filter', async () => {
    (prisma.company.findMany as any).mockResolvedValue([{ id: 'c1' }]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(prisma.company.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('filters to verified companies with ?verified=true', async () => {
    (prisma.company.findMany as any).mockResolvedValue([]);
    await GET(req('?verified=true') as any);
    expect(prisma.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isVerified: true } }),
    );
  });
});
