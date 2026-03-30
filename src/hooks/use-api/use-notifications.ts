import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { notificationService, NotificationResponse } from '@/services/api/notifications';
import toast from 'react-hot-toast';

export const useNotifications = (
    params: Record<string, any> = {}, 
    options?: Omit<UseQueryOptions<NotificationResponse>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['notifications', params],
        queryFn: () => notificationService.getNotifications(params),
        ...options,
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to mark notification as read');
        },
    });
};

export const useMarkAllNotificationsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications marked as read');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to mark all as read');
        },
    });
};

export const useDeleteNotification = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => notificationService.deleteNotification(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('Notification deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete notification');
        },
    });
};
