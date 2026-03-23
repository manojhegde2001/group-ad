import { getIO } from './socket-io';

/**
 * Server-side service to trigger real-time events via Socket.io
 */
export const socketService = {
    /**
     * Notify a specific user about a new notification or update
     */
    notifyUser: (userId: string, payload: { type: string; message: string; data?: any }) => {
        const io = getIO();
        if (io) {
            io.to(`user:${userId}`).emit('notification', payload);
            console.log(`Socket emission: notification to user:${userId}`, payload.type);
        }
    },

    /**
     * Broadcast a new message to a conversation room
     */
    emitMessage: (conversationId: string, message: any) => {
        const io = getIO();
        if (io) {
            io.to(`conv:${conversationId}`).emit('new_message', message);
            console.log(`Socket emission: new_message to conv:${conversationId}`);
        }
    },
    
    /**
     * Generic refresh event
     */
    refreshUnread: (userId: string) => {
        const io = getIO();
        if (io) {
            io.to(`user:${userId}`).emit('refresh_unread');
        }
    }
};
