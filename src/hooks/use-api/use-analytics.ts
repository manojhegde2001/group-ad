import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/api/analytics';

export const useProfileAnalytics = () => {
    return useQuery({
        queryKey: ['analytics', 'profile'],
        queryFn: () => analyticsService.getProfileAnalytics(),
    });
};

export const usePostsAnalytics = () => {
    return useQuery({
        queryKey: ['analytics', 'posts'],
        queryFn: () => analyticsService.getPostsAnalytics(),
    });
};

export const useBusinessAnalytics = () => {
    return useQuery({
        queryKey: ['analytics', 'business'],
        queryFn: () => analyticsService.getBusinessAnalytics(),
    });
};
