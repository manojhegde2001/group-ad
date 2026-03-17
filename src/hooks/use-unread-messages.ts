'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';

export function useUnreadMessages(pollInterval = 30_000) {
  const { isAuthenticated } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await fetch('/api/conversations/unread-count');
      if (!res.ok) return;
      const data = await res.json();
      setTotalUnread(data.totalUnread ?? 0);
    } catch {
      /* silent */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTotalUnread(0);
      return;
    }
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, pollInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, fetchUnread, pollInterval]);

  // Allows components to manually trigger a refresh (e.g. after reading messages)
  return { totalUnread, refresh: fetchUnread };
}
