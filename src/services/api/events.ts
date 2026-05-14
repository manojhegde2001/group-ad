import { apiClient } from '@/lib/api-client';

export const eventService = {
    getEvents: (params: Record<string, any> = {}) => {
        const searchParams = new URLSearchParams(params);
        return apiClient.get<any>(`/api/events?${searchParams.toString()}`);
    },
    getEvent: (idOrSlug: string) => apiClient.get<any>(`/api/events/${idOrSlug}`),
    updateEvent: (id: string, data: any) => apiClient.patch<any>(`/api/events/${id}`, data),
    createEvent: (data: any) => apiClient.post<any>('/api/events', data),
    enrollEvent: (id: string) => apiClient.post<any>(`/api/events/${id}/enroll`),
    unenrollEvent: (id: string) => apiClient.delete<any>(`/api/events/${id}/enroll`),
    getMyEnrollment: (id: string, userId: string) => apiClient.get<any>(`/api/events/${id}/enrollments/${userId}`),
    getEventEnrollments: (id: string) => apiClient.get<{ enrollments: any[] }>(`/api/events/${id}/enrollments`),
    updateEnrollmentStatus: (eventId: string, enrollmentId: string, status: string) => 
        apiClient.patch(`/api/events/${eventId}/enrollments/${enrollmentId}`, { status }),
    bulkRegister: (eventId: string, participants: any[]) => 
        apiClient.post(`/api/events/${eventId}/bulk-register`, { participants }),
    bulkAttendance: (eventId: string, attendees: any[]) => 
        apiClient.post(`/api/events/${eventId}/bulk-attendance`, { attendees }),
    submitAttendance: (eventId: string, data: any) => 
        apiClient.post(`/api/events/${eventId}/attendance`, data),
    getAttendanceTicket: (eventId: string) => 
        apiClient.get<any>(`/api/events/${eventId}/attendance-ticket`),
    getCoAttendees: (eventId: string) => apiClient.get<{ coAttendees: any[] }>(`/api/events/${eventId}/co-attendees`),
    checkIn: (eventId: string, token: string) => apiClient.post<any>(`/api/events/${eventId}/check-in`, { token }),
    getCheckInToken: (eventId: string) => apiClient.get<{ token: string }>(`/api/events/${eventId}/check-in/token`),
};
