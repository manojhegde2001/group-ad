import { useQuery } from '@tanstack/react-query';
import { searchService } from '@/services/api/search';

export const useMainSearch = (query: string) => {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => searchService.search(query),
    enabled: query.length >= 2,
    staleTime: 60_000,
  });
};
