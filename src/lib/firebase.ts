import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: "G-BDP20S34RQ"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

let authPromise: Promise<any> | null = null;

/**
 * Ensures the user is authenticated with Firebase.
 * Fetches a custom token from our backend and signs in.
 */
export const ensureFirebaseAuth = async () => {
    if (typeof window === 'undefined') return null;
    
    // If already authenticated, return current user
    if (auth.currentUser) return auth.currentUser;

    // If an auth process is already in progress, wait for it
    if (authPromise) return authPromise;

    authPromise = (async () => {
        try {
            const response = await fetch('/api/auth/firebase-token');
            const data = await response.json();
            
            if (data.error || !data.token) {
                console.error('Failed to get firebase custom token:', data.error || 'No token provided');
                authPromise = null; // Reset so we can try again
                return null;
            }

            const userCredential = await signInWithCustomToken(auth, data.token);
            authPromise = null; // Success, clear promise
            return userCredential.user;
        } catch (error) {
            console.error('Error during firebase sign-in:', error);
            authPromise = null; // Error, reset so we can try again
            return null;
        }
    })();

    return authPromise;
};

// Initialize Analytics (optional, client-side only)
export const initAnalytics = async () => {
    if (typeof window !== 'undefined' && await isSupported()) {
        return getAnalytics(app);
    }
    return null;
};

export default app;
