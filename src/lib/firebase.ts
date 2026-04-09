import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getMessaging, Messaging } from "firebase/messaging";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBaCwj4yN0ptt4CPgdIoAv0ykHN3uZQU8o",
  authDomain: "group-ad.firebaseapp.com",
  projectId: "group-ad",
  storageBucket: "group-ad.firebasestorage.app",
  messagingSenderId: "197438417852",
  appId: "1:197438417852:web:15790a6531ef95916499b9",
  measurementId: "G-BDP20S34RQ"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Messaging (Client-side)
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Initialize Analytics (optional, client-side only)
export const initAnalytics = async () => {
    if (typeof window !== 'undefined' && await isSupported()) {
        return getAnalytics(app);
    }
    return null;
};

export default app;
