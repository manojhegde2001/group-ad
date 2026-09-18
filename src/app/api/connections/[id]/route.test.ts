import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    connection: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock('@/lib/socket-service', () => ({ socketService: { notifyUser: vi.fn() } }));

import { PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'c1' }) };
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/connections/c1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/connections/c1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/connections/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the connection does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the current user is not the receiver', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue({ id: 'c1', receiverId: 'u2', requesterId: 'u3' });
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.connection.update).not.toHaveBeenCalled();
  });

  it('accepts a request and notifies the requester', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue({ id: 'c1', receiverId: 'u1', requesterId: 'u2' });
    (prisma.connection.update as any).mockResolvedValue({ id: 'c1', status: 'ACCEPTED' });
    (prisma.notification.create as any).mockResolvedValue({ id: 'n1', message: 'accepted' });
    const res = await PATCH(patchReq({ action: 'ACCEPT' }) as any, ctx as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.connection.status).toBe('ACCEPTED');
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('rejects a request without creating a notification', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue({ id: 'c1', receiverId: 'u1', requesterId: 'u2' });
    (prisma.connection.update as any).mockResolvedValue({ id: 'c1', status: 'REJECTED' });
    const res = await PATCH(patchReq({ action: 'REJECT' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/connections/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('404 when the connection does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('403 when the current user is neither requester nor receiver', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue({ id: 'c1', requesterId: 'u2', receiverId: 'u3' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
    expect(prisma.connection.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the connection for a participant', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1' } });
    (prisma.connection.findUnique as any).mockResolvedValue({ id: 'c1', requesterId: 'u1', receiverId: 'u2' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.connection.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
