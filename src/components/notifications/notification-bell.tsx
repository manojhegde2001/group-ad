'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Loader2, X, Trash2 } from 'lucide-react';
import { ActionIcon } from '@/components/ui/action-icon';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { useSocket } from '@/components/providers/socket-provider';
import { Popover } from 'rizzui';
import { cn } from '@/lib/utils';

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

interface NotificationBellProps {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function NotificationBell({ isOpen: controlledOpen, onOpenChange }: NotificationBellProps) {
    const { isAuthenticated } = useAuth();
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = useCallback((val: boolean | ((v: boolean) => boolean)) => {
        const next = typeof val === 'function' ? val(open) : val;
        if (onOpenChange) onOpenChange(next);
        else setInternalOpen(next);
    }, [open, onOpenChange]);

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { unreadCount, refresh: refreshUnreadCount } = useUnreadNotifications();
    const [loading, setLoading] = useState(false);
    const [markingAll, setMarkingAll] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    // Track previously seen notification IDs to detect new ones
    const seenIdsRef = useRef<Set<string>>(new Set());
    const isFirstFetchRef = useRef(true);
    const { socket } = useSocket();

    // Request browser notification permission once on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    const fireBrowserNotification = useCallback((notif: any) => {
        if (
            typeof window === 'undefined' ||
            !('Notification' in window) ||
            Notification.permission !== 'granted'
        ) return;

        const title = notif.sender
            ? `New message from ${notif.sender.name}`
            : notif.type === 'MESSAGE_RECEIVED' ? 'New Message' : notif.title || 'New notification';
        const body = notif.message;

        try {
            const n = new Notification(title, {
                body,
                icon: '/auth/logo-small.png',
                tag: notif.id, // prevents duplicate toasts
            });
            setTimeout(() => n.close(), 5000);
        } catch { /* silent */ }
    }, []);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        try {
            const res = await fetch('/api/notifications?limit=15');
            if (!res.ok) return;
            const data = await res.json();
            const fetched: Notification[] = data.notifications ?? [];

            // Update seen IDs
            fetched.forEach((n) => seenIdsRef.current.add(n.id));
            isFirstFetchRef.current = false;

            setNotifications(fetched);
            refreshUnreadCount();
        } catch { /* silent */ }
    }, [isAuthenticated, refreshUnreadCount]);

    // Socket.io Listener
    useEffect(() => {
        if (!socket) return;

        socket.on('notification', (payload) => {
            console.log('Real-time notification socket event:', payload);
            fetchNotifications(); // Refresh the list
            
            // Fire a browser notification for messages if not on the messages page
            if (payload.type === 'MESSAGE_RECEIVED' && window.location.pathname !== '/messages') {
                fireBrowserNotification(payload);
            }
        });

        socket.on('refresh_unread', () => {
            fetchNotifications();
        });

        return () => {
            socket.off('notification');
            socket.off('refresh_unread');
        };
    }, [socket, fetchNotifications, fireBrowserNotification]);

    const markOne = async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
        refreshUnreadCount();
    };

    const markAll = async () => {
        setMarkingAll(true);
        try {
            await fetch('/api/notifications/read-all', { method: 'PATCH' });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            refreshUnreadCount();
        } finally {
            setMarkingAll(false);
        }
    };

    const deleteOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
        refreshUnreadCount();
    };

    // Initial fetch
    useEffect(() => {
        if (!isAuthenticated) return;
        fetchNotifications();
    }, [isAuthenticated, fetchNotifications]);

    if (!isAuthenticated) return null;

    return (
        <div className="relative">
            <Popover isOpen={open} setIsOpen={setOpen} placement="bottom-end">
                <Popover.Trigger>
                    <button
                        className="relative p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors shrink-0"
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    >
                        <Bell className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-0.5 ring-2 ring-white dark:ring-secondary-950 leading-none">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>
                </Popover.Trigger>
                
                <Popover.Content className="z-[9999] p-0 w-[min(calc(100vw-2rem),420px)] bg-white dark:bg-secondary-900 rounded-[1.5rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-900/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-sm text-secondary-900 dark:text-white uppercase tracking-tight">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAll}
                                disabled={markingAll}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors disabled:opacity-50"
                            >
                                {markingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[70vh] sm:max-h-[480px] overflow-y-auto overscroll-contain">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">Syncing...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                    <Bell className="w-8 h-8 text-secondary-200 dark:text-secondary-700" />
                                </div>
                                <h4 className="text-secondary-900 dark:text-white font-black uppercase text-xs tracking-tight">All caught up!</h4>
                                <p className="text-[11px] text-secondary-500 mt-1 uppercase tracking-widest leading-relaxed">Notifications will appear here as they arrive.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-secondary-50 dark:divide-secondary-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => !notif.isRead && markOne(notif.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                !notif.isRead && markOne(notif.id);
                                            }
                                        }}
                                        className={cn(
                                            "w-full text-left flex items-start gap-4 px-5 py-4 transition-all duration-200 group relative",
                                            !notif.isRead ? "bg-primary-50/30 dark:bg-primary-900/5 hover:bg-primary-50/60 transition-colors" : "hover:bg-secondary-50 dark:hover:bg-secondary-800/40"
                                        )}
                                    >
                                        {/* Avatar / Icon Container */}
                                        <div className="shrink-0 relative">
                                            {notif.sender ? (
                                                <Avatar
                                                    src={notif.sender.avatar ?? undefined}
                                                    name={notif.sender.name}
                                                    size="sm"
                                                    className="w-11 h-11 rounded-xl shadow-sm ring-2 ring-white dark:ring-secondary-800"
                                                />
                                            ) : (
                                                <div className="w-11 h-11 rounded-xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-xl shadow-sm">
                                                    {NOTIFICATION_ICONS[notif.type] ?? '🔔'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-[13px] leading-[1.4] transition-colors",
                                                !notif.isRead ? "font-bold text-secondary-900 dark:text-white" : "font-medium text-secondary-600 dark:text-secondary-400"
                                            )}>
                                                {notif.message}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mt-1.5 flex items-center gap-1.5 opacity-70">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                            </p>
                                        </div>

                                        {/* Indicators / Actions */}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            {!notif.isRead && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                            )}
                                            <button
                                                onClick={(e) => deleteOne(notif.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-secondary-400 hover:text-red-500 transition-all active:scale-90"
                                                title="Delete Notification"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-secondary-100 dark:border-secondary-800 bg-secondary-50/30 dark:bg-secondary-900/30 text-center">
                            <button
                                onClick={() => setOpen(false)}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors"
                            >
                                Dismiss Panel
                            </button>
                        </div>
                    )}
                </Popover.Content>
            </Popover>
        </div>
    );
}
