import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    message: { count: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/conversations/unread-count', () => {
  it('returns totalUnread=0 with a 401 status when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.totalUnread).toBe(0);
  });

  it("200 returns the count of the current user's unread messages", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.message.count as any).mockResolvedValue(4);
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.totalUnread).toBe(4);
    expect(prisma.message.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          senderId: { not: 'u1' },
          conversation: { participantIds: { has: 'u1' } },
        }),
      }),
    );
  });

  it('returns totalUnread=0 with a 500 status when the query throws', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.message.count as any).mockRejectedValue(new Error('db down'));
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json.totalUnread).toBe(0);
  });
});
