import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/lib/fcm-service';

export type NotificationType = 
    | 'CONNECTION_REQUEST'
    | 'CONNECTION_ACCEPTED'
    | 'POST_LIKE'
    | 'POST_COMMENT'
    | 'POST_SHARE'
    | 'EVENT_REMINDER'
    | 'EVENT_ENROLLMENT'
    | 'EVENT_APPROVED'
    | 'MESSAGE_RECEIVED'
    | 'VERIFICATION_APPROVED'
    | 'VERIFICATION_REJECTED'
    | 'MEETING_INVITE'
    | 'SYSTEM_ANNOUNCEMENT';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    senderId?: string;
}

export const notificationService = {
    /**
     * Create a notification and send FCM push
     */
    async create(params: CreateNotificationParams) {
        try {
            // 1. Create in Database
            const notification = await prisma.notification.create({
                data: {
                    userId: params.userId,
                    type: params.type,
                    title: params.title,
                    message: params.message,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    senderId: params.senderId,
                },
            });

            // 2. Send FCM Push Notification
            const user = await prisma.user.findUnique({
                where: { id: params.userId },
                select: { fcmTokens: true }
            });

            if (user?.fcmTokens && user.fcmTokens.length > 0) {
                for (const token of user.fcmTokens) {
                    try {
                        await sendPushNotification(token, {
                            title: params.title,
                            body: params.message,
                            data: {
                                notificationId: notification.id,
                                type: params.type,
                                entityId: params.entityId,
                            }
                        });
                    } catch (fcmError) {
                        console.error(`Failed to send FCM to token ${token}:`, fcmError);
                    }
                }
            }

            return notification;
        } catch (error) {
            console.error('Error in notificationService.create:', error);
            throw error;
        }
    }
};

