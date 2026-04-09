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
                    // Use long VAPID key from environment if available
                    const token = await getToken(messaging, {
                        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 'BDP20S34RQ' 
                    });

                    if (token) {
                        // Check if token already exists in session storage to prevent spamming
                        const lastToken = sessionStorage.getItem('fcm_token');
                        if (lastToken === token) return;

                        console.log('FCM Token registered:', token);
                        // Save token to user profile
                        const res = await fetch('/api/user/fcm-token', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token }),
                        });
                        
                        if (res.ok) {
                            sessionStorage.setItem('fcm_token', token);
                        }
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
