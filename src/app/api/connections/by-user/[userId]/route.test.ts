import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connection: { findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { deleteMany: vi.fn(() => Promise.resolve({ count: 0 })), create: vi.fn() },
  },
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));

import { PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ userId: 'requester1' }) };
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/connections/by-user/requester1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/connections/by-user/requester1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.notification.deleteMany as any).mockResolvedValue({ count: 0 });
});

describe('PATCH /api/connections/by-user/[userId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when there is no pending request from that user to the current user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('accepts the request and notifies the original requester', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', name: 'U One' } });
    (prisma.connection.findFirst as any).mockResolvedValue({ id: 'c1' });
    (prisma.connection.update as any).mockResolvedValue({ id: 'c1', status: 'ACCEPTED' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'accepted' });
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.connection.status).toBe('ACCEPTED');
    expect(prisma.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'requester1' }) }),
    );
  });

  it('rejects the request without creating a notification', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue({ id: 'c1' });
    (prisma.connection.update as any).mockResolvedValue({ id: 'c1', status: 'REJECTED' });
    const res = await PATCH(patchReq({ action: 'REJECT' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/connections/by-user/[userId]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when there is no connection between the two users', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('200 deletes the connection', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findFirst as any).mockResolvedValue({ id: 'c1' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
