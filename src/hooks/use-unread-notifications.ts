'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-api/use-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/components/providers/socket-provider';

export function useUnreadNotifications(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const { socket } = useSocket();

    const { data } = useNotifications(
        { limit: 1 },
        { 
            enabled: isAuthenticated,
            refetchOnWindowFocus: true,
            refetchInterval: pollInterval,
        }
    );

    useEffect(() => {
        if (!socket || !isAuthenticated) return;

        const handleNotification = (payload: any) => {
            // Any notification should trigger a refresh of the notification list
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [socket, isAuthenticated, queryClient]);

    const unreadCount = data?.unreadCount ?? 0;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return { unreadCount, refresh };
}

