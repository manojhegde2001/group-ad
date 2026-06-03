import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingService, MeetingRequestPayload } from '@/services/api/meetings';
import toast from 'react-hot-toast';

export const useMeetings = () => {
    return useQuery<{ meetings: any[] }>({
        queryKey: ['meetings'],
        queryFn: () => meetingService.getMeetings(),
    });
};

export const useRequestMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: MeetingRequestPayload) => meetingService.requestMeeting(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            toast.success('Meeting request sent!');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send meeting request');
        },
    });
};

export const useUpdateMeeting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ meetingId, status }: { meetingId: string; status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' }) =>
            meetingService.updateMeeting(meetingId, status),
        onSuccess: (_, { status }) => {
            queryClient.invalidateQueries({ queryKey: ['meetings'] });
            const messages: Record<string, string> = {
                ACCEPTED: 'Meeting accepted!',
                REJECTED: 'Meeting declined.',
                CANCELLED: 'Meeting request cancelled.',
            };
            toast.success(messages[status] || 'Meeting updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update meeting');
        },
    });
};
