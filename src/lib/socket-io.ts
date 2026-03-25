import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

// Use globalThis to store the Socket.io instance
// This ensures it persists across Next.js reloads and is shared across the app context
declare global {
    var io: SocketIOServer | undefined;
}

export const initSocket = (server: NetServer) => {
    if (!global.io) {
        global.io = new SocketIOServer(server, {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        global.io.on('connection', (socket) => {
            console.log('Socket connected:', socket.id);

            socket.on('join-user', (userId: string) => {
                socket.join(`user:${userId}`);
                console.log(`Socket ${socket.id} joined user room: user:${userId}`);
            });

            socket.on('join-conversation', (conversationId: string) => {
                socket.join(`conv:${conversationId}`);
                console.log(`Socket ${socket.id} joined conversation room: conv:${conversationId}`);
            });

            socket.on('leave-conversation', (conversationId: string) => {
                socket.leave(`conv:${conversationId}`);
                console.log(`Socket ${socket.id} left conversation room: conv:${conversationId}`);
            });

            socket.on('typing', ({ conversationId, userId, name }: { conversationId: string; userId: string; name: string }) => {
                socket.to(`conv:${conversationId}`).emit('user_typing', { conversationId, userId, name });
            });

            socket.on('stop_typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
                socket.to(`conv:${conversationId}`).emit('user_stop_typing', { conversationId, userId });
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected:', socket.id);
            });
        });
    }
    return global.io;
};

export const getIO = () => global.io;
