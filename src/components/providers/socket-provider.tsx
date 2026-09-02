'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { logger } from '@/lib/logger';

type SocketContextType = {
    socket: Socket | null;
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        // socket.io-client (~15kb) is loaded on demand — only authenticated
        // sessions ever open a socket, so anonymous pages never pay for it.
        let socketInstance: Socket | null = null;
        let cancelled = false;

        import('socket.io-client').then(({ io }) => {
            if (cancelled) return;

            socketInstance = io(window.location.host === 'localhost:3000' ? 'http://localhost:3000' : window.location.origin, {
                path: '/api/socket/io',
                addTrailingSlash: false,
            });

            socketInstance.on('connect', () => {
                logger.debug('Socket.io connected');
                setIsConnected(true);

                if (user?.id) {
                    socketInstance?.emit('join-user', user.id);
                }
            });

            socketInstance.on('disconnect', () => {
                logger.debug('Socket.io disconnected');
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (err) => {
                logger.debug('Socket.io connection error', { message: err.message });
                setIsConnected(false);
            });

            setSocket(socketInstance);
        });

        return () => {
            cancelled = true;
            socketInstance?.disconnect();
        };
    }, [isAuthenticated, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
