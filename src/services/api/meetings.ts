import { apiClient } from '@/lib/api-client';

export interface MeetingRequestPayload {
    receiverId: string;
    proposedTime: string; // ISO string
    agenda?: string;
}

export const meetingService = {
    getMeetings: () => apiClient.get<{ meetings: any[] }>('/api/meetings'),
    requestMeeting: (data: MeetingRequestPayload) => apiClient.post<any>('/api/meetings', data),
    updateMeeting: (meetingId: string, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') =>
        apiClient.patch<any>(`/api/meetings/${meetingId}`, { status }),
};
