'use client';

import { useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'react-hot-toast';

export function FCMTokenManager() {
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (typeof window === 'undefined' || !messaging || !isAuthenticated || !user) return;

        const requestPermission = async () => {
            if (!messaging) return;
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    // Get FCM token
                    const token = await getToken(messaging, {
                        vapidKey: 'BDP20S34RQ' 
                    });

                    if (token) {
                        console.log('FCM Token:', token);
                        // Save token to user profile
                        await fetch('/api/user/fcm-token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token }),
                        });
                    }
                }
            } catch (error) {
                console.error('Error getting FCM token:', error);
            }
        };

        requestPermission();

        // Listen for foreground messages
        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            if (payload.notification) {
                toast(payload.notification.body || 'New notification', {
                    icon: '🔔',
                    duration: 5000,
                });
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated, user]);

    return null;
}
