import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => apiClient.get<{ categories: any[] }>('/api/categories').then(res => res.categories),
    });
};

export const useCompanies = () => {
    return useQuery({
        queryKey: ['companies'],
        queryFn: () => apiClient.get<{ companies: any[] }>('/api/companies').then(res => res.companies),
    });
};
