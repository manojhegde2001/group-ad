'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db, messaging } from '@/lib/firebase';
import { signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, where, orderBy, limit, doc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

type FirebaseContextType = {
    user: User | null;
    loading: boolean;
    fcmToken: string | null;
};

const FirebaseContext = createContext<FirebaseContextType>({
    user: null,
    loading: true,
    fcmToken: null,
});

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
    const { user: authUser, isAuthenticated } = useAuth();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

    // 1. Sync Firebase Auth with NextAuth
    useEffect(() => {
        if (!isAuthenticated || !authUser?.id) {
            auth.signOut();
            setUser(null);
            setLoading(false);
            return;
        }

        const syncAuth = async () => {
            try {
                // If already signed in as the correct user, skip
                if (auth.currentUser?.uid === authUser.id) {
                    setUser(auth.currentUser);
                    setLoading(false);
                    return;
                }

                // Get custom token from our API
                const resp = await fetch('/api/auth/firebase-token');
                const { token, error } = await resp.json();
                
                if (error) throw new Error(error);

                const userCredential = await signInWithCustomToken(auth, token);
                setUser(userCredential.user);
            } catch (err) {
                console.error('Firebase sync error:', err);
                // toast.error('Real-time sync failed');
            } finally {
                setLoading(false);
            }
        };

        syncAuth();

        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });

        return () => unsubscribe();
    }, [isAuthenticated, authUser?.id]);

    // 2. Register FCM Token
    useEffect(() => {
        if (!user || typeof window === 'undefined') return;

        const setupFCM = async () => {
            try {
                const m = await messaging();
                if (!m) return;

                const permission = await Notification.requestPermission();
                if (permission !== 'granted') return;

                const token = await getToken(m, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
                });

                if (token) {
                    setFcmToken(token);
                    // Save token to Firestore for the user
                    await setDoc(doc(db, 'users', user.uid), {
                        fcmToken: token,
                        updatedAt: Timestamp.now(),
                    }, { merge: true });
                }

                // Handle foreground messages
                onMessage(m, (payload) => {
                    console.log('Foreground message received:', payload);
                    toast.success(payload.notification?.title || 'New notification', {
                        description: payload.notification?.body,
                    } as any);
                });

            } catch (err) {
                console.error('FCM setup error:', err);
            }
        };

        setupFCM();
    }, [user]);

    return (
        <FirebaseContext.Provider value={{ user, loading, fcmToken }}>
            {children}
        </FirebaseContext.Provider>
    );
};
