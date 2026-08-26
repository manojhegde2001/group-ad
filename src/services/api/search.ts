import { apiClient } from '@/lib/api-client';

export interface SearchResult {
  id: string;
  type: 'post' | 'event' | 'company';
  title: string;
  subtitle: string;
  href: string;
  image?: string | null;
  logo?: string | null;
  date?: string | null;
}

export const searchService = {
  search: (query: string) =>
    apiClient.get<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(query)}`),
};
