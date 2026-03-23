'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/components/providers/socket-provider';

export function useUnreadNotifications(pollInterval = 30_000) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { socket } = useSocket();

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      // We fetch with limit=1 because we only care about the unreadCount field 
      // returned by the standard /api/notifications endpoint.
      const res = await fetch('/api/notifications?limit=1');
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      /* silent */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    socket.on('notification', () => {
      fetchUnread();
    });

    socket.on('refresh_unread', () => {
      fetchUnread();
    });

    return () => {
      socket.off('notification');
      socket.off('refresh_unread');
    };
  }, [socket, fetchUnread]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, pollInterval);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchUnread, pollInterval]);

  return { unreadCount, refresh: fetchUnread };
}
