'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';
import { useNotifications } from '@/hooks/use-api/use-notifications';
import { useQueryClient } from '@tanstack/react-query';

export function useUnreadNotifications(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const params = useMemo(() => ({ limit: 1 }), []);
    const { data } = useNotifications(
        params,
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

    return { unreadCount, refresh };
}

