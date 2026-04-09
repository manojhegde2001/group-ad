import * as admin from 'firebase-admin';

const getApp = () => {
  if (admin.apps.length) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If we're missing credentials during build, don't crash the whole app.
  // This allows 'next build' to complete even if keys aren't in env yet.
  if (!projectId || !clientEmail || !privateKey) {
    if (process.env.NODE_ENV === 'production') {
        console.warn('Firebase Admin credentials missing in production environment');
    }
    // Return dummy init or just let it fail gracefully later
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error', error);
    return null;
  }
};

export const getAdminAuth = () => {
    const app = getApp();
    return app ? admin.auth(app) : null;
};

export const getAdminDb = () => {
    const app = getApp();
    return app ? admin.firestore(app) : null;
};

export const getAdminMessaging = () => {
    const app = getApp();
    return app ? admin.messaging(app) : null;
};

export default admin;


