'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';
import { useQueryClient } from '@tanstack/react-query';

import { useUnreadMessagesCount } from '@/hooks/use-api/use-messages';

export function useUnreadMessages(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    
    const { data: countData, refetch } = useUnreadMessagesCount({
        enabled: isAuthenticated,
        refetchInterval: pollInterval,
    });

    const totalUnread = countData?.totalUnread || 0;

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (payload: any) => {
            if (payload.type === 'MESSAGE_RECEIVED') {
                refetch();
                queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        };

        const handleRefresh = () => {
            refetch();
            queryClient.invalidateQueries({ queryKey: [ 'messages', 'unread-count'] });
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_unread', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_unread', handleRefresh);
        };
    }, [socket, refetch, queryClient]);

    return { totalUnread, refresh: refetch };
}

