import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const privateKey = process.env.FIREBASE_PRIVATE_KEY 
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('Firebase Admin initialized successfully');
    } catch (error) {
        console.error('Firebase Admin initialization error', error);
    }
}

export const getAdminAuth = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    return admin.auth();
};

export const getAdminDb = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    return admin.firestore();
};

export const getAdminMessaging = () => {
    if (!admin.apps.length) throw new Error('Firebase Admin not initialized');
    return admin.messaging();
};

export default admin;
