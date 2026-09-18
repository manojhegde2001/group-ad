import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    conversation: { findFirst: vi.fn() },
    message: { findMany: vi.fn(), update: vi.fn() },
    notification: { updateMany: vi.fn() },
  },
}));

import { PATCH } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'conv1' }) };
const req = () => new Request('http://localhost/api/conversations/conv1/read', { method: 'PATCH' });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.notification.updateMany as any).mockResolvedValue({ count: 0 });
});

describe('PATCH /api/conversations/[id]/read', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(req() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the current user is not a participant', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findFirst as any).mockResolvedValue(null);
    const res = await PATCH(req() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('marks every unread message as read and clears related notifications', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findFirst as any).mockResolvedValue({ id: 'conv1' });
    (prisma.message.findMany as any).mockResolvedValue([{ id: 'm1', readBy: [] }, { id: 'm2', readBy: [] }]);
    const res = await PATCH(req() as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.marked).toBe(2);
    expect(prisma.message.update).toHaveBeenCalledTimes(2);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'u1', entityId: 'conv1' }) }),
    );
  });

  it('marks zero messages when everything is already read', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.conversation.findFirst as any).mockResolvedValue({ id: 'conv1' });
    (prisma.message.findMany as any).mockResolvedValue([]);
    const res = await PATCH(req() as any, ctx as any);
    const json = await res.json();
    expect(json.marked).toBe(0);
    expect(prisma.message.update).not.toHaveBeenCalled();
  });
});
