import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | undefined;

export const initSocket = (server: NetServer) => {
    if (!io) {
        io = new SocketIOServer(server, {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        io.on('connection', (socket) => {
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

            socket.on('disconnect', () => {
                console.log('Socket disconnected:', socket.id);
            });
        });
    }
    return io;
};

export const getIO = () => io;
