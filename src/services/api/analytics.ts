import { apiClient } from '@/lib/api-client';

export const analyticsService = {
  getProfileAnalytics: () => apiClient.get<any>('/api/analytics/profile'),
  getPostsAnalytics: () => apiClient.get<any>('/api/analytics/posts'),
  getBusinessAnalytics: () => apiClient.get<any>('/api/analytics/business'),
};
