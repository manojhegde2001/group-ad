import { getAdminDb, getAdminMessaging } from './firebase-admin';

/**
 * Server-side service to trigger real-time events via Firebase
 */
export const firebaseService = {
    /**
     * Send an FCM notification to a specific user
     */
    notifyUser: async (userId: string, payload: { type: string; title?: string; message: string; data?: any }) => {
        try {
            // 1. Log notification in Firestore for in-app history
            await getAdminDb().collection('notifications').add({
                userId,
                type: payload.type,
                title: payload.title || 'Notification',
                message: payload.message,
                data: payload.data || {},
                isRead: false,
                createdAt: new Date().toISOString(),
            });

            // 2. Send FCM notification if user has a registered token
            const userDoc = await getAdminDb().collection('users').doc(userId).get();
            const fcmToken = userDoc.data()?.fcmToken;

            if (fcmToken) {
                await getAdminMessaging().send({
                    token: fcmToken,
                    notification: {
                        title: payload.title || 'New Notification',
                        body: payload.message,
                    },
                    data: {
                        type: payload.type,
                        ...payload.data,
                    },
                });
                console.log(`FCM notification sent to user ${userId}`);
            }
        } catch (error) {
            console.error('Error sending notification via Firebase:', error);
        }
    },

    /**
     * Write a message to Firestore for real-time delivery
     */
    emitMessage: async (conversationId: string, message: any) => {
        try {
            await getAdminDb().collection('conversations').doc(conversationId).collection('messages').doc(message.id).set({
                ...message,
                createdAt: message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
            });
            console.log(`Firestore message written for conv ${conversationId}`);
        } catch (error) {
            console.error('Error emitting message via Firestore:', error);
        }
    },

    /**
     * Update typing status in Firestore
     */
    setTypingStatus: async (conversationId: string, userId: string, name: string, isTyping: boolean) => {
        try {
            const typingRef = getAdminDb().collection('conversations').doc(conversationId).collection('typing').doc(userId);
            if (isTyping) {
                await typingRef.set({ name, updatedAt: new Date().toISOString() });
            } else {
                await typingRef.delete();
            }
        } catch (error) {
            console.error('Error updating typing status via Firestore:', error);
        }
    }
};
