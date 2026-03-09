import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService } from '@/services/api/events';
import toast from 'react-hot-toast';

export const useEvents = (params: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['events', params],
        queryFn: () => eventService.getEvents(params),
    });
};

export const useEvent = (id: string) => {
    return useQuery({
        queryKey: ['event', id],
        queryFn: () => eventService.getEvent(id),
        enabled: !!id,
    });
};

export const useEnrollEvent = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => eventService.enrollEvent(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['event', id] });
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
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['event', id] });
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
            toast.success('Event created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create event');
        },
    });
};
