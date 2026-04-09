/**
 * FCM Service to send push notifications using the Firebase Cloud Messaging API
 */

const FCM_SERVER_KEY = "gtH7QXkJsjUqJjo6wOkXbv3RVxqj46s9cQyRFh7J964";

export interface FcmPayload {
    title: string;
    body: string;
    icon?: string;
    data?: any;
}

export const sendPushNotification = async (fcmToken: string, payload: FcmPayload) => {
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`,
            },
            body: JSON.stringify({
                to: fcmToken,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    icon: payload.icon || '/auth/logo-small.png',
                    click_action: payload.data?.url || '/',
                },
                data: payload.data || {},
                priority: 'high',
            }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending FCM push notification:', error);
        throw error;
    }
};

export const sendPushNotificationToMultiple = async (fcmTokens: string[], payload: FcmPayload) => {
    if (!fcmTokens || fcmTokens.length === 0) return;
    
    // FCM legacy allows up to 1000 tokens in "registration_ids"
    try {
        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`,
            },
            body: JSON.stringify({
                registration_ids: fcmTokens,
                notification: {
                    title: payload.title,
                    body: payload.body,
                    icon: payload.icon || '/auth/logo-small.png',
                    click_action: payload.data?.url || '/',
                },
                data: payload.data || {},
                priority: 'high',
            }),
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error sending multicast FCM push:', error);
        throw error;
    }
};
