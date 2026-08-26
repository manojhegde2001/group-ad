import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export interface TrendingTag {
  tag: string;
  count: number;
  image: string | null;
}

export async function getTrendingTagsServer(limit = 12): Promise<TrendingTag[]> {
  try {
    const results = await prisma.post.aggregateRaw({
      pipeline: [
        { $match: { visibility: 'PUBLIC', tags: { $exists: true, $ne: [] } } },
        { $sort: { createdAt: -1 } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 }, sampleImages: { $first: '$images' } } },
        { $sort: { count: -1 } },
        { $limit: limit },
      ],
    });

    return (results as unknown as any[]).map((r) => ({
      tag: r._id as string,
      count: r.count as number,
      image: Array.isArray(r.sampleImages) && r.sampleImages.length > 0 ? r.sampleImages[0] : null,
    }));
  } catch (error) {
    logger.error('Error fetching trending tags in server service', error);
    throw error;
  }
}
