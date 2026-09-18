import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { updateMany: vi.fn() },
  },
}));

import { PATCH } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/notifications/read-all', { method: 'PATCH' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/notifications/read-all', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(req() as any);
    expect(res.status).toBe(401);
  });

  it("200 marks only the current user's unread notifications as read", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    const res = await PATCH(req() as any);
    expect(res.status).toBe(200);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1', isRead: false } }),
    );
  });
});
