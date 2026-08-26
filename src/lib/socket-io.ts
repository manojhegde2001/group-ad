import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/lib/logger';

let io: SocketIOServer | undefined;

export const initSocket = (server: NetServer) => {
    if (!io) {
        io = new SocketIOServer(server, {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        io.on('connection', (socket) => {
            logger.debug('Socket connected', { socketId: socket.id });

            socket.on('join-user', (userId: string) => {
                socket.join(`user:${userId}`);
                logger.debug(`Socket ${socket.id} joined user room: user:${userId}`);
            });

            socket.on('join-conversation', (conversationId: string) => {
                socket.join(`conv:${conversationId}`);
                logger.debug(`Socket ${socket.id} joined conversation room: conv:${conversationId}`);
            });

            socket.on('typing', ({ conversationId, userId, name, isTyping }: { conversationId: string; userId: string; name: string; isTyping: boolean }) => {
                socket.to(`conv:${conversationId}`).emit('user-typing', { userId, name, isTyping });
            });

            socket.on('leave-conversation', (conversationId: string) => {
                socket.leave(`conv:${conversationId}`);
                logger.debug(`Socket ${socket.id} left conversation room: conv:${conversationId}`);
            });

            socket.on('disconnect', () => {
                logger.debug('Socket disconnected', { socketId: socket.id });
            });
        });
    }
    return io;
};

export const getIO = () => io;
