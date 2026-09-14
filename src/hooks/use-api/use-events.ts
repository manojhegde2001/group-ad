import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { eventService } from '@/services/api/events';
import toast from 'react-hot-toast';

export const useEvents = (params: Record<string, any> = {}, options: any = {}) => {
    return useQuery<{ events: any[] }>({
        queryKey: ['events', params],
        queryFn: () => eventService.getEvents(params),
        ...options,
    });
};

// Paginated "load more" browsing — mirrors useInfinitePosts (use-posts.ts).
export const useInfiniteEvents = (params: Record<string, any> = {}, options: any = {}) => {
    return useInfiniteQuery({
        queryKey: ['events', 'infinite', params],
        queryFn: ({ pageParam = 1 }) => eventService.getEvents({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        },
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
