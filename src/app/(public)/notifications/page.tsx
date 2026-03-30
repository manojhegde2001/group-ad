'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar } from '@/components/ui/avatar';
import { Bell, CheckCheck, Loader2, X, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
    useNotifications, 
    useMarkNotificationRead, 
    useMarkAllNotificationsRead, 
    useDeleteNotification 
} from '@/hooks/use-api/use-notifications';

const NOTIF_ICONS: Record<string, string> = {
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

export default function NotificationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data, isLoading, isFetching, refetch } = useNotifications(
    { limit: 50 },
    { enabled: isAuthenticated }
  );

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount ?? 0;

  const displayed = filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen"><p className="text-secondary-500">Please log in to view notifications.</p></div>;
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-secondary-900 dark:text-white tracking-tight">Notifications</h1>
            {unreadCount > 0 && <p className="text-sm text-secondary-500 mt-0.5">{unreadCount} unread</p>}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => refetch()} 
              disabled={isFetching}
              className="p-2 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors disabled:opacity-50" 
              title="Refresh"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                {markAllReadMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-5">
          {(['all', 'unread'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all',
                filter === f ? 'bg-primary-500 text-white' : 'bg-white dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-800'
              )}
            >
              {f} {f === 'unread' && unreadCount > 0 && `(${unreadCount})`}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Bell className="w-12 h-12 text-secondary-200" />
              <p className="font-semibold text-secondary-500">{filter === 'unread' ? "No unread notifications" : "You're all caught up!"}</p>
              <p className="text-xs text-secondary-400">Notifications will appear here when you receive them</p>
            </div>
          ) : (
            <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
              {displayed.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-4 cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors group',
                    !n.isRead && 'bg-primary-50/50 dark:bg-primary-900/10'
                  )}
                >
                  {/* Icon / Avatar */}
                  {n.sender ? (
                    <Avatar src={n.sender.avatar ?? undefined} name={n.sender.name} size="sm" className="w-10 h-10 shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-xl shrink-0 mt-0.5">
                      {NOTIF_ICONS[n.type] ?? '🔔'}
                    </span>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white leading-snug">{n.title}</p>
                    <p className="text-xs text-secondary-500 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-secondary-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary-500" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(n.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
