import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { categoryService, Category } from '@/services/api/categories';

export const useCategories = (
  params?: { trending?: boolean; limit?: number }, 
  options?: Omit<UseQueryOptions<{ categories: Category[] }>, 'queryKey' | 'queryFn'>
) => {
  return useQuery({
    queryKey: ['categories', params],
    queryFn: () => categoryService.getCategories(params),
    ...options
  });
};

export const useCategoryBySlug = (slug: string) => {
  return useQuery<{ category: Category }>({
    queryKey: ['categories', 'slug', slug],
    queryFn: () => categoryService.getCategoryBySlug(slug),
    enabled: !!slug,
  });
};
