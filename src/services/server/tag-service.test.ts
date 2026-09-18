import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    post: { aggregateRaw: vi.fn() },
  },
}));

import { getTrendingTagsServer } from './tag-service';
import { prisma } from '@/lib/prisma';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getTrendingTagsServer', () => {
  it('maps the aggregation pipeline results into { tag, count, image }', async () => {
    (prisma.post.aggregateRaw as any).mockResolvedValue([
      { _id: 'networking', count: 5, sampleImages: ['img.png'] },
      { _id: 'startups', count: 3, sampleImages: [] },
    ]);
    const result = await getTrendingTagsServer();
    expect(result).toEqual([
      { tag: 'networking', count: 5, image: 'img.png' },
      { tag: 'startups', count: 3, image: null },
    ]);
  });

  it('passes the limit through to the pipeline $limit stage', async () => {
    (prisma.post.aggregateRaw as any).mockResolvedValue([]);
    await getTrendingTagsServer(5);
    const call = (prisma.post.aggregateRaw as any).mock.calls[0][0];
    const limitStage = call.pipeline.find((stage: any) => '$limit' in stage);
    expect(limitStage.$limit).toBe(5);
  });

  it('propagates errors from the aggregation', async () => {
    (prisma.post.aggregateRaw as any).mockRejectedValue(new Error('db down'));
    await expect(getTrendingTagsServer()).rejects.toThrow('db down');
  });
});
