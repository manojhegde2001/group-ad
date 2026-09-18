import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { GET, POST } from './route';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const getReq = () => new Request('http://localhost/api/admin/categories');
const postReq = (body: unknown) =>
  new Request('http://localhost/api/admin/categories', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/admin/categories', () => {
  it('200 lists all categories (no auth required)', async () => {
    (prisma.category.findMany as any).mockResolvedValue([{ id: 'c1' }]);
    const res = await GET(getReq() as any);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.categories).toHaveLength(1);
  });
});

describe('POST /api/admin/categories', () => {
  it('403 when unauthenticated', async () => {
    (auth as any).mockResolvedValue(null);
    const res = await POST(postReq({ name: 'Doctors' }) as any);
    expect(res.status).toBe(403);
  });

  it('403 for a non-ADMIN user', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'u1', userType: 'BUSINESS' } });
    const res = await POST(postReq({ name: 'Doctors' }) as any);
    expect(res.status).toBe(403);
  });

  it('400 when a category with the derived slug already exists', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue({ id: 'existing' });
    const res = await POST(postReq({ name: 'Doctors' }) as any);
    expect(res.status).toBe(400);
    expect(prisma.category.create).not.toHaveBeenCalled();
  });

  it('200 creates the category with a derived slug', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'admin1', userType: 'ADMIN' } });
    (prisma.category.findUnique as any).mockResolvedValue(null);
    (prisma.category.create as any).mockResolvedValue({ id: 'c1', name: 'Doctors', slug: 'doctors' });
    const res = await POST(postReq({ name: 'Doctors' }) as any);
    expect(res.status).toBe(200);
    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ slug: 'doctors' }) }),
    );
  });
});
