import { useQuery, useMutation } from '@tanstack/react-query';
import { commonService } from '@/services/api/common';
import toast from 'react-hot-toast';

export const useCategories = () => {
    return useQuery({
        queryKey: ['categories'],
        queryFn: () => commonService.getCategories().then(res => res.categories),
    });
};

export const useCompanies = () => {
    return useQuery({
        queryKey: ['companies'],
        queryFn: () => commonService.getCompanies().then(res => res.companies),
    });
};

export const useUpload = () => {
    return useMutation({
        mutationFn: ({ file, resourceType }: { file: File, resourceType?: 'image' | 'video' }) => 
            commonService.uploadFile(file, resourceType),
        onError: (error: any) => {
            toast.error(error.message || 'Upload failed');
        }
    });
};
