'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';
import { useUnreadMessagesCount } from '@/hooks/use-api/use-messages';
import { useQueryClient } from '@tanstack/react-query';

export function useUnreadMessages(pollInterval = 30_000) {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data } = useUnreadMessagesCount({
        enabled: isAuthenticated,
        refetchInterval: pollInterval,
        refetchOnWindowFocus: true,
    });

    const totalUnread = data?.count ?? 0;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    };

    return { totalUnread, refresh };
}

