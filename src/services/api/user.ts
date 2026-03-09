import { apiClient } from '@/lib/api-client';

export const userService = {
    getProfile: () => apiClient.get<any>('/api/user/profile'),
    updateProfile: (data: any) => apiClient.patch<any>('/api/user/profile', data),
    changePassword: (data: any) => apiClient.put<any>('/api/user/profile', data),
    getMe: () => apiClient.get<any>('/api/auth/me'),
    upgradeToBusiness: (data?: any) => apiClient.post<any>('/api/user/upgrade-to-business', data),
    getByUsername: (username: string) => apiClient.get<{ user: any }>(`/api/users/by-username/${username}`),
    uploadAvatar: (formData: FormData) => apiClient.post<any>('/api/user/upload-avatar', formData),
};
