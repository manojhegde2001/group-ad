import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connection: { findMany: vi.fn() },
    powerTeamMember: { findMany: vi.fn() },
    user: { findMany: vi.fn(), findUnique: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/users/suggestions');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.connection.findMany as any).mockResolvedValue([]);
  (prisma.powerTeamMember.findMany as any).mockResolvedValue([]);
  (prisma.user.findMany as any).mockResolvedValue([]);
});

describe('GET /api/users/suggestions', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it('200 returns power-team-mate suggestions tagged with their reason', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.powerTeamMember.findMany as any).mockResolvedValue([{ powerTeamId: 't1' }]);
    (prisma.user.findMany as any)
      .mockResolvedValueOnce([{ id: 'teammate1', name: 'Teammate', _count: { followers: 0 } }]) // teamMateSuggestions
      .mockResolvedValueOnce([]); // mutualUsers
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.suggestions[0]).toMatchObject({ id: 'teammate1', suggestionReason: 'Power Team' });
  });

  it('falls back to category suggestions when there are fewer than 3 results', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.user.findMany as any)
      .mockResolvedValueOnce([]) // teamMateSuggestions
      .mockResolvedValueOnce([]) // mutualUsers
      .mockResolvedValueOnce([{ id: 'cat-match', name: 'Cat Match', _count: { followers: 0 } }]); // categorySuggestions
    (prisma.user.findUnique as any).mockResolvedValue({ categoryId: 'cat1' });
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.suggestions.some((s: any) => s.suggestionReason === 'Similar Category')).toBe(true);
  });
});
