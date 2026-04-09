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

/**
 * Ensures the user is authenticated with Firebase.
 * Fetches a custom token from our backend and signs in.
 */
export const ensureFirebaseAuth = async () => {
    if (typeof window === 'undefined') return;
    
    // If already authenticated, return
    if (auth.currentUser) return auth.currentUser;

    try {
        const response = await fetch('/api/auth/firebase-token');
        const { token, error } = await response.json();
        
        if (error || !token) {
            console.error('Failed to get firebase custom token', error);
            return null;
        }

        const userCredential = await signInWithCustomToken(auth, token);
        return userCredential.user;
    } catch (error) {
        console.error('Error during firebase sign-in', error);
        return null;
    }
};

// Initialize Analytics (optional, client-side only)
export const initAnalytics = async () => {
    if (typeof window !== 'undefined' && await isSupported()) {
        return getAnalytics(app);
    }
    return null;
};

export default app;
