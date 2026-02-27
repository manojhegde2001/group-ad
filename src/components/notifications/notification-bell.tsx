'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    sender?: {
        id: string;
        name: string;
        username: string;
        avatar?: string | null;
    } | null;
}

const NOTIFICATION_ICONS: Record<string, string> = {
    CONNECTION_REQUEST: '👤',
    CONNECTION_ACCEPTED: '🤝',
    POST_LIKE: '❤️',
    POST_COMMENT: '💬',
    POST_SHARE: '🔁',
    EVENT_REMINDER: '📅',
    EVENT_ENROLLMENT: '🎟️',
    EVENT_APPROVED: '✅',
    MESSAGE_RECEIVED: '✉️',
    VERIFICATION_APPROVED: '✔️',
    VERIFICATION_REJECTED: '❌',
    MEETING_INVITE: '📹',
    SYSTEM_ANNOUNCEMENT: '📢',
};

export function NotificationBell() {
    const { isAuthenticated } = useAuth();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch('/api/notifications?limit=15');
            if (!res.ok) return;
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(data.unreadCount ?? 0);
        } catch { /* silent */ }
    }, [isAuthenticated]);

    // Initial fetch + polling every 30s
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
        intervalRef.current = setInterval(fetchNotifications, 30_000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isAuthenticated, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = async () => {
        setOpen((v) => !v);
        if (!open) {
            setLoading(true);
            await fetchNotifications();
            setLoading(false);
        }
    };

    const markOne = async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        await fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => { });
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await fetch('/api/notifications/read-all', { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } finally {
            setMarkingAll(false);
        }
    };

    const deleteOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const deleted = notifications.find((n) => n.id === id);
        if (deleted && !deleted.isRead) setUnreadCount((c) => Math.max(0, c - 1));
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => { });
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell icon */}
            <button
                onClick={handleOpen}
                className="relative p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
                <Bell className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-0.5 ring-2 ring-white dark:ring-secondary-950 leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden animate-scale-in z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100 dark:border-secondary-800">
                        <h3 className="font-semibold text-sm text-secondary-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAll}
                                disabled={markingAll}
                                className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                            >
                                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <Bell className="w-10 h-10 text-secondary-300 mb-3" />
                                <p className="text-sm text-secondary-500 dark:text-secondary-400">You're all caught up!</p>
                            </div>
                        ) : (
                            notifications.map((notif) => (
                                <button
                                    key={notif.id}
                                    onClick={() => !notif.isRead && markOne(notif.id)}
                                    className={`w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-800/60 transition-colors group ${!notif.isRead ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''
                                        }`}
                                >
                                    {/* Sender avatar or icon */}
                                    {notif.sender ? (
                                        <Avatar
                                            src={notif.sender.avatar ?? undefined}
                                            name={notif.sender.name}
                                            size="sm"
                                            rounded="full"
                                            className="w-9 h-9 shrink-0 mt-0.5"
                                        />
                                    ) : (
                                        <span className="w-9 h-9 shrink-0 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-base mt-0.5">
                                            {NOTIFICATION_ICONS[notif.type] ?? '🔔'}
                                        </span>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-secondary-900 dark:text-white leading-snug line-clamp-2">
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-secondary-400 mt-0.5">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                        {!notif.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                                        )}
                                        <button
                                            onClick={(e) => deleteOne(notif.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-all"
                                            aria-label="Dismiss"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-secondary-100 dark:border-secondary-800 px-4 py-2 flex justify-center">
                            <button
                                onClick={() => setOpen(false)}
                                className="text-xs text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
