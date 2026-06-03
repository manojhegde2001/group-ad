import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/api/events';
import toast from 'react-hot-toast';

export const useEvents = (params: Record<string, any> = {}, options: any = {}) => {
    return useQuery<{ events: any[] }>({
        queryKey: ['events', params],
        queryFn: () => eventService.getEvents(params),
        ...options,
    });
};

export const useEvent = (id: string) => {
    return useQuery<{ event: any; userEnrollment?: any }>({
        queryKey: ['event', id],
        queryFn: () => eventService.getEvent(id),
        enabled: !!id,
    });
};

export const useEnrollEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => eventService.enrollEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Enrolled successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to enroll');
        },
    });
};

export const useUnenrollEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => eventService.unenrollEvent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['event'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            toast.success('Withdrawn successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to withdraw');
        },
    });
};
export const useCreateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => eventService.createEvent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            toast.success('Event created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create event');
        },
    });
};

export const useUpdateEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => eventService.updateEvent(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['event', id] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            toast.success('Event updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update event');
        },
    });
};
export const useCoAttendees = (eventId: string) => {
    return useQuery<{ coAttendees: any[] }>({
        queryKey: ['events', eventId, 'co-attendees'],
        queryFn: () => eventService.getCoAttendees(eventId),
        enabled: !!eventId,
    });
};

export const useSubmitAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, data }: { eventId: string; data: any }) => 
            eventService.submitAttendance(eventId, data),
        onSuccess: (_, { eventId }) => {
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            toast.success('Attendance recorded');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to record attendance');
        }
    });
};

export const useAttendanceTicket = (eventId: string, options: any = {}) => {
    return useQuery({
        queryKey: ['event', eventId, 'attendance-ticket'],
        queryFn: () => eventService.getAttendanceTicket(eventId),
        enabled: !!eventId,
        ...options,
    });
};

export const useCheckIn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ eventId, token }: { eventId: string; token: string }) => 
            eventService.checkIn(eventId, token),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Check-in failed');
        }
    });
};

export const useCheckInToken = (eventId: string, options: any = {}) => {
    return useQuery<{ token: string }>({
        queryKey: ['event', eventId, 'check-in-token'],
        queryFn: () => eventService.getCheckInToken(eventId),
        enabled: !!eventId,
        ...options,
    });
};

export const useInviteConnections = () => {
    return useMutation({
        mutationFn: ({ eventId, userIds }: { eventId: string; userIds: string[] }) => 
            eventService.inviteConnections(eventId, userIds),
        onSuccess: () => {
            toast.success('Invitations sent successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send invitations');
        }
    });
};

export const useMyEvents = (options: any = {}) => {
    return useQuery<{ enrollments: any[] }>({
        queryKey: ['events', 'my'],
        queryFn: () => eventService.getMyEvents(),
        ...options,
    });
};
