'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUnreadMessagesCount } from '@/hooks/use-api/use-messages';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, collectionGroup, onSnapshot, query, where, limit } from 'firebase/firestore';

export function useUnreadMessages(pollInterval = 30_000) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const { data } = useUnreadMessagesCount({
        enabled: isAuthenticated,
        // Polling disabled in favor of real-time messaging delivery
        refetchOnWindowFocus: true,
    });

    useEffect(() => {
        if (!isAuthenticated || !queryClient) return;

        // Invalidate unread count when new messages arrive in any conversation
        // Note: collectionGroup requires an index. Alternatively, listen to specific conversations.
        // For now, we trust the real-time message delivery in the page or FCM to trigger refreshes.
        // But we can also listen to notifications of type MESSAGE_RECEIVED.
        
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', user?.id || ''),
            where('type', '==', 'MESSAGE_RECEIVED'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                queryClient.invalidateQueries({ queryKey: [ 'messages', 'unread-count'] });
                queryClient.invalidateQueries({ queryKey: ['conversations'] });
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated, user?.id, queryClient]);

    const totalUnread = data?.count ?? 0;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    };

    return { totalUnread, refresh };
}

