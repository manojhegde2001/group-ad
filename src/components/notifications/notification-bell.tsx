'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadNotifications } from '@/hooks/use-unread-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { messaging, ensureFirebaseAuth } from '@/lib/firebase';
import { onMessage } from 'firebase/messaging';
import { Popover } from 'rizzui';
import { cn } from '@/lib/utils';
import { 
    useNotifications, 
    useMarkNotificationRead, 
    useMarkAllNotificationsRead, 
    useDeleteNotification 
} from '@/hooks/use-api/use-notifications';

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
    const queryClient = useQueryClient();

    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = useCallback((val: boolean | ((v: boolean) => boolean)) => {
        const next = typeof val === 'function' ? val(open) : val;
        if (onOpenChange) onOpenChange(next);
        else setInternalOpen(next);
    }, [open, onOpenChange]);

    const { unreadCount } = useUnreadNotifications();

    const { data, isLoading } = useNotifications(
        { limit: 15 },
        { enabled: isAuthenticated && open }
    );

    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();
    const deleteMutation = useDeleteNotification();

    const notifications = data?.notifications || [];

    // Browser Notification permission
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
                tag: notif.id,
            });
            setTimeout(() => n.close(), 5000);
        } catch { /* silent */ }
    }, []);

    // FCM Foreground Listener
    useEffect(() => {
        if (!isAuthenticated || !messaging) return;

        const unsubscribe = onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            
            // Show browser notification if needed
            if (window.location.pathname !== '/messages') {
                fireBrowserNotification({
                    title: payload.notification?.title,
                    message: payload.notification?.body,
                    type: payload.data?.type,
                    id: payload.data?.notificationId
                });
            }
        });

        // Ensure firebase auth is active to keep connection alive
        ensureFirebaseAuth();

        return () => unsubscribe();
    }, [isAuthenticated, queryClient, fireBrowserNotification]);


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
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors disabled:opacity-50"
                            >
                                {markAllReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[70vh] sm:max-h-[480px] overflow-y-auto overscroll-contain">
                        {isLoading ? (
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
                                        onClick={() => !notif.isRead && markReadMutation.mutate(notif.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                !notif.isRead && markReadMutation.mutate(notif.id);
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
                                                onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(notif.id); }}
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
