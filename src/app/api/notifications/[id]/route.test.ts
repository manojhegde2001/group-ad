import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    notification: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'n1' }) };
const patchReq = () => new Request('http://localhost/api/notifications/n1', { method: 'PATCH' });
const deleteReq = () => new Request('http://localhost/api/notifications/n1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/notifications/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the notification does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the notification belongs to someone else', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findUnique as any).mockResolvedValue({ userId: 'u2' });
    const res = await PATCH(patchReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('200 marks the notification as read', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findUnique as any).mockResolvedValue({ userId: 'u1' });
    (prisma.notification.update as any).mockResolvedValue({ id: 'n1', isRead: true });
    const res = await PATCH(patchReq() as any, ctx as any);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/notifications/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('403 when the notification belongs to someone else', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findUnique as any).mockResolvedValue({ userId: 'u2' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.notification.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the notification for its owner', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.notification.findUnique as any).mockResolvedValue({ userId: 'u1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.notification.delete).toHaveBeenCalledWith({ where: { id: 'n1' } });
  });
});
