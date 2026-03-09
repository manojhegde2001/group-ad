import { apiClient } from '@/lib/api-client';

export const eventService = {
    getEvents: (params: Record<string, any> = {}) => {
        const searchParams = new URLSearchParams(params);
        return apiClient.get<any>(`/api/events?${searchParams.toString()}`);
    },
    getEvent: (idOrSlug: string) => apiClient.get<any>(`/api/events/${idOrSlug}`),
    createEvent: (data: any) => apiClient.post<any>('/api/events', data),
    enrollEvent: (id: string) => apiClient.post<any>(`/api/events/${id}/enroll`),
    unenrollEvent: (id: string) => apiClient.delete<any>(`/api/events/${id}/enroll`),
    getMyEnrollment: (id: string, userId: string) => apiClient.get<any>(`/api/events/${id}/enrollments/${userId}`),
};
