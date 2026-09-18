import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { findMany: vi.fn(), count: vi.fn() },
    user: { findMany: vi.fn() },
  },
}));

import { GET } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const req = () => new Request('http://localhost/api/notifications');

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.notification.count as any).mockResolvedValue(0);
});

describe('GET /api/notifications', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await GET(req() as any);
    expect(res.status).toBe(401);
  });

  it("200 scopes notifications to the current user and enriches with sender info", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findMany as any).mockResolvedValue([{ id: 'n1', senderId: 's1' }]);
    (prisma.user.findMany as any).mockResolvedValue([{ id: 's1', name: 'Sender' }]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.notifications[0].sender.name).toBe('Sender');
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
  });

  it('skips the sender lookup entirely when no notifications have a senderId', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findMany as any).mockResolvedValue([{ id: 'n1', senderId: null }]);
    const res = await GET(req() as any);
    const json = await res.json();
    expect(json.notifications[0].sender).toBeNull();
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });
});
