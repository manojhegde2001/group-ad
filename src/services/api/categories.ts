import { apiClient } from '@/lib/api-client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  banner?: string | null;
  _count: {
    posts: number;
    events?: number;
  };
}

export const categoryService = {
  getCategories: (params: { trending?: boolean; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.trending) query.append('trending', 'true');
    if (params.limit) query.append('limit', params.limit.toString());
    
    return apiClient.get<{ categories: Category[] }>(`/api/categories?${query.toString()}`);
  },

  getCategoryBySlug: (slug: string) =>
    apiClient.get<{ category: Category }>(`/api/categories/${slug}`),
};
