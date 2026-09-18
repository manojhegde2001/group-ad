import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/services/server/tag-service', () => ({ getTrendingTagsServer: vi.fn() }));

import { GET } from './route';
import { getTrendingTagsServer } from '@/services/server/tag-service';

const req = (qs = '') => new Request(`http://localhost/api/tags/trending${qs}`);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/tags/trending', () => {
  it('200 defaults to a limit of 12', async () => {
    (getTrendingTagsServer as any).mockResolvedValue([]);
    const res = await GET(req() as any);
    expect(res.status).toBe(200);
    expect(getTrendingTagsServer).toHaveBeenCalledWith(12);
  });

  it('passes a custom limit through from the query string', async () => {
    (getTrendingTagsServer as any).mockResolvedValue([]);
    await GET(req('?limit=5') as any);
    expect(getTrendingTagsServer).toHaveBeenCalledWith(5);
  });

  it('500 when getTrendingTagsServer throws', async () => {
    (getTrendingTagsServer as any).mockRejectedValue(new Error('db down'));
    const res = await GET(req() as any);
    expect(res.status).toBe(500);
  });
});
