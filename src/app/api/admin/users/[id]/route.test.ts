import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn(), delete: vi.fn() },
  },
}));

import { PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'u2' }) };
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/admin/users/u2', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/admin/users/u2', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/admin/users/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('401 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(401);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('400 for an invalid payload', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    const res = await PATCH(patchReq({ userType: 'ROOT' }) as any, ctx as any);
    expect(res.status).toBe(400);
  });

  it("200 updates the target user's fields, treating categoryId NONE as null", async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.update as any).mockResolvedValue({ id: 'u2', name: 'New Name' });
    const res = await PATCH(patchReq({ name: 'New Name', categoryId: 'NONE' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u2' }, data: expect.objectContaining({ categoryId: null }) }),
    );
  });
});

describe('DELETE /api/admin/users/[id]', () => {
  it('401 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
  });

  it('401 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'INDIVIDUAL' } });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(401);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('200 deletes the target user for an ADMIN', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.user.delete as any).mockResolvedValue({ id: 'u2' });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
  });
});
