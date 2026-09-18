import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    venue: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { prisma } from '@/lib/prisma';

const req = (qs = '') => new Request(`http://localhost/api/venues${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/venues', () => {
  it('200 lists all venues with no filter', async () => {
    (prisma.venue.findMany as any).mockResolvedValue([{ id: 'v1' }]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.count).toBe(1);
    expect(prisma.venue.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('filters by city when provided', async () => {
    (prisma.venue.findMany as any).mockResolvedValue([]);
    await GET(req('?city=Pune') as any);
    expect(prisma.venue.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { city: { contains: 'Pune', mode: 'insensitive' } } }),
    );
  });
});
