import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/server/category-service', () => ({ getCategoriesServer: vi.fn() }));

import { GET } from './route';
import { getCategoriesServer } from '@/services/server/category-service';

const req = (qs = '') => new Request(`http://localhost/api/categories${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/categories', () => {
  it('200 delegates to getCategoriesServer with parsed params, defaulting active=true', async () => {
    (getCategoriesServer as any).mockResolvedValue({ categories: [] });
    const res = await GET(req() as any);
    expect(res.status).toBe(200);
    expect(getCategoriesServer).toHaveBeenCalledWith({ active: true, trending: false });
  });

  it('passes active=false and trending=true through from query params', async () => {
    (getCategoriesServer as any).mockResolvedValue({ categories: [] });
    await GET(req('?active=false&trending=true') as any);
    expect(getCategoriesServer).toHaveBeenCalledWith({ active: false, trending: true });
  });

  it('500 when getCategoriesServer throws', async () => {
    (getCategoriesServer as any).mockRejectedValue(new Error('db down'));
    const res = await GET(req() as any);
    expect(res.status).toBe(500);
  });
});
