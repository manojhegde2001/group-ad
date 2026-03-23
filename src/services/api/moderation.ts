import { apiClient } from '@/lib/api-client';

export const moderationService = {
  report: (data: { targetType: string; targetId: string; reason: string; description?: string }) =>
    apiClient.post('/api/reports', data),
    
  blockUser: (blockedId: string) =>
    apiClient.post('/api/blocks', { blockedId }),
    
  unblockUser: (blockedId: string) =>
    apiClient.delete(`/api/blocks/${blockedId}`),
    
  getBlockedUsers: () =>
    apiClient.get('/api/blocks'),
    
  getAdminReports: () =>
    apiClient.get('/api/admin/reports'),
    
  updateReportStatus: (data: { reportId: string; status: string; adminNote?: string }) =>
    apiClient.patch('/api/admin/reports', data),
};
