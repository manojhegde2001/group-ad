import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { tagService, TrendingTag } from '@/services/api/tags';

export const useTrendingTags = (
  limit?: number,
  options?: Omit<UseQueryOptions<{ tags: TrendingTag[] }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['tags', 'trending', limit],
    queryFn: () => tagService.getTrendingTags(limit),
    ...options,
  });
};
