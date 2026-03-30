import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/api/categories';

export const useCategories = (params?: { trending?: boolean; limit?: number }) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryService.getCategories(params),
  });
};

export const useCategoryBySlug = (slug: string) => {
  return useQuery({
    queryKey: ['categories', 'slug', slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
    enabled: !!slug,
  });
};
