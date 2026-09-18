import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: { findMany: vi.fn() },
  },
}));

import { getCategoriesServer } from './category-service';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.category.findMany as any).mockResolvedValue([]);
});

describe('getCategoriesServer', () => {
  it('defaults to isActive:true, ordered by name', async () => {
    await getCategoriesServer();
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    );
  });

  it('drops the isActive filter when active=false', async () => {
    await getCategoriesServer({ active: false });
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it('orders by post count when trending=true', async () => {
    await getCategoriesServer({ trending: true });
    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { posts: { _count: 'desc' } } }),
    );
  });

  it('applies a take limit only when provided', async () => {
    await getCategoriesServer({ limit: 5 });
    expect(prisma.category.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));

    (prisma.category.findMany as any).mockClear();
    await getCategoriesServer({});
    const call = (prisma.category.findMany as any).mock.calls[0][0];
    expect(call.take).toBeUndefined();
  });

  it('returns categories with a matching count', async () => {
    (prisma.category.findMany as any).mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);
    const result = await getCategoriesServer();
    expect(result.count).toBe(2);
  });

  it('propagates errors from prisma', async () => {
    (prisma.category.findMany as any).mockRejectedValue(new Error('db down'));
    await expect(getCategoriesServer()).rejects.toThrow('db down');
  });
});
