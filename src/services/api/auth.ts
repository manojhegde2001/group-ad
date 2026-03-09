import { apiClient } from '@/lib/api-client';

export const authService = {
    signup: (data: any) => apiClient.post('/api/auth/signup', data),
    // login is handled by next-auth (signIn), but we might have custom checks
};
