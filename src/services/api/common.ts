import { apiClient } from '@/lib/api-client';

export const commonService = {
    uploadFile: (file: File, resourceType: 'image' | 'video' = 'image') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('resource_type', resourceType);
        return apiClient.post<{ url: string }>('/api/upload', formData);
    },
    
    getCategories: () => apiClient.get<{ categories: any[] }>('/api/categories'),
    getCompanies: () => apiClient.get<{ companies: any[] }>('/api/companies'),
};
