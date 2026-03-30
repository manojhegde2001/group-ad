'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';
import { useNotifications } from '@/hooks/use-api/use-notifications';
import { useQueryClient } from '@tanstack/react-query';

export function useUnreadNotifications(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();

    const { data } = useNotifications(
        { limit: 1 },
        { 
            enabled: isAuthenticated,
            refetchInterval: pollInterval,
            refetchOnWindowFocus: true,
        }
    );

    const unreadCount = data?.unreadCount ?? 0;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleNotification = () => {
            refresh();
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_unread', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_unread', handleNotification);
        };
    }, [socket, isAuthenticated]);

    return { unreadCount, refresh };
}
