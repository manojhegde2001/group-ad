import { apiClient } from '@/lib/api-client';

export interface TrendingTag {
  tag: string;
  count: number;
  image: string | null;
}

export const tagService = {
  getTrendingTags: (limit?: number) => {
    const query = new URLSearchParams();
    if (limit) query.append('limit', limit.toString());

    return apiClient.get<{ tags: TrendingTag[] }>(`/api/tags/trending?${query.toString()}`);
  },
};
