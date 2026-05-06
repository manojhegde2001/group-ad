import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/api/analytics';

export const useProfileAnalytics = (options?: any) => {
    return useQuery<any>({
        queryKey: ['analytics', 'profile'],
        queryFn: () => analyticsService.getProfileAnalytics(),
        ...options,
    });
};

export const usePostsAnalytics = (options?: any) => {
    return useQuery<any>({
        queryKey: ['analytics', 'posts'],
        queryFn: () => analyticsService.getPostsAnalytics(),
        ...options,
    });
};

export const useBusinessAnalytics = (options?: any) => {
    return useQuery<any>({
        queryKey: ['analytics', 'business'],
        queryFn: () => analyticsService.getBusinessAnalytics(),
        ...options,
    });
};
