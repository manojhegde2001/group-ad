'use client';

import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-api/use-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';

export function useUnreadNotifications(pollInterval = 30_000) {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    const params = useMemo(() => ({ limit: 1 }), []);
    const { data } = useNotifications(
        params,
        { 
            enabled: isAuthenticated,
            // Polling disabled in favor of Firestore listener
            refetchOnWindowFocus: true,
        }
    );

    useEffect(() => {
        if (!isAuthenticated || !queryClient) return;

        // Listen for new notifications in Firestore
        // We assume notifications are mirrored to Firestore for real-time
        const q = query(
            collection(db, 'notifications'), 
            where('userId', '==', user?.id || ''),
            orderBy('createdAt', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated, user?.id, queryClient]);

    const unreadCount = data?.unreadCount ?? 0;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    return { unreadCount, refresh };
}

