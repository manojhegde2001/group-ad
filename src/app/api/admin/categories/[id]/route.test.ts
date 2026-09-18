import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import { PATCH, DELETE } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const ctx = { params: Promise.resolve({ id: 'c1' }) };
const patchReq = (body: unknown) =>
  new Request('http://localhost/api/admin/categories/c1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const deleteReq = () => new Request('http://localhost/api/admin/categories/c1', { method: 'DELETE' });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('PATCH /api/admin/categories/[id]', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('404 when the category does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue(null);
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('400 when renaming to a slug already used by another category', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any)
      .mockResolvedValueOnce({ id: 'c1', name: 'Old Name' })
      .mockResolvedValueOnce({ id: 'other-category', slug: 'new-name' });
    const res = await PATCH(patchReq({ name: 'New Name' }) as any, ctx as any);
    expect(res.status).toBe(400);
    expect(prisma.category.update).not.toHaveBeenCalled();
  });

  it('200 updates the category without a slug change when the name is unchanged', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'c1', name: 'Doctors' });
    (prisma.category.update as any).mockResolvedValue({ id: 'c1', name: 'Doctors', description: 'Updated' });
    const res = await PATCH(patchReq({ description: 'Updated' }) as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.category.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { description: 'Updated' } }),
    );
  });
});

describe('DELETE /api/admin/categories/[id]', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(403);
  });

  it('404 when the category does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue(null);
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(404);
  });

  it('400 when the category has associated posts, events, or users', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 'c1',
      _count: { posts: 2, events: 0, users: 0 },
    });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(400);
    expect(prisma.category.delete).not.toHaveBeenCalled();
  });

  it('200 deletes an unused category', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue({
      id: 'c1',
      _count: { posts: 0, events: 0, users: 0 },
    });
    const res = await DELETE(deleteReq() as any, ctx as any);
    expect(res.status).toBe(200);
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
  });
});
