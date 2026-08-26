'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';
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
                // eslint-disable-next-line react-hooks/set-state-in-effect -- disconnects and clears socket state when auth is lost
                setSocket(null);
                setIsConnected(false);
            }
            return;
        }

        const socketInstance = ClientIO(window.location.host === 'localhost:3000' ? 'http://localhost:3000' : window.location.origin, {
            path: '/api/socket/io',
            addTrailingSlash: false,
        });

        socketInstance.on('connect', () => {
            logger.debug('Socket.io connected');
            setIsConnected(true);
            
            if (user?.id) {
                socketInstance.emit('join-user', user.id);
            }
        });

        socketInstance.on('disconnect', () => {
            logger.debug('Socket.io disconnected');
            setIsConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [isAuthenticated, user?.id]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
