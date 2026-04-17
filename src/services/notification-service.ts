import { prisma } from '@/lib/prisma';
import { firebaseService } from '@/lib/firebase-service';

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

            // 2. Deliver via Firebase (FCM + Firestore real-time)
            await firebaseService.notifyUser(params.userId, {
                type: params.type,
                title: params.title,
                message: params.message,
                data: {
                    notificationId: notification.id,
                    entityType: params.entityType,
                    entityId: params.entityId,
                    senderId: params.senderId,
                }
            });

            return notification;
        } catch (error) {
            console.error('Error in notificationService.create:', error);
            // Don't throw to prevent breaking the caller (like follow) if Firebase fails
            return null;
        }
    }
};

