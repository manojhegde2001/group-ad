import { apiClient } from '@/lib/api-client';

export const authService = {
    signup: (data: any) => apiClient.post('/api/auth/signup', data),
    forgotPassword: (data: { email: string }) => apiClient.post('/api/auth/forgot-password', data),
    resetPassword: (data: any) => apiClient.post('/api/auth/reset-password', data),
    // login is handled by next-auth (signIn), but we might have custom checks
};
