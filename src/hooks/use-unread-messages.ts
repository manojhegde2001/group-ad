'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';
import { useQueryClient } from '@tanstack/react-query';

export function useUnreadMessages(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const [totalUnread, setTotalUnread] = useState(0);
    const { socket } = useSocket();
    const queryClient = useQueryClient();
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchUnread = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch('/api/conversations/unread-count');
            if (res.ok) {
                const data = await res.json();
                setTotalUnread(data.totalUnread || data.count || 0);
            }
        } catch (error) {
            console.error('Failed to fetch unread messages count:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (payload: any) => {
            if (payload.type === 'MESSAGE_RECEIVED') {
                fetchUnread();
                queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        };

        const handleRefresh = () => {
            fetchUnread();
            queryClient.invalidateQueries({ queryKey: [ 'messages', 'unread-count'] });
        };

        socket.on('notification', handleNotification);
        socket.on('refresh_unread', handleRefresh);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('refresh_unread', handleRefresh);
        };
    }, [socket, fetchUnread, queryClient]);

    useEffect(() => {
        if (!isAuthenticated) {
            setTotalUnread(0);
            return;
        }

        fetchUnread();
        intervalRef.current = setInterval(fetchUnread, pollInterval);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isAuthenticated, fetchUnread, pollInterval]);

    return { totalUnread, refresh: fetchUnread };
}

