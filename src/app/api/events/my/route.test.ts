import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    eventEnrollment: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/events/my');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/events/my', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it("200 scopes to the current user's enrollments", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.eventEnrollment.findMany as any).mockResolvedValue([{ id: 'en1' }]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.enrollments).toHaveLength(1);
    expect(prisma.eventEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });
});
