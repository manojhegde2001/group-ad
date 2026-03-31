import { apiClient } from '@/lib/api-client';

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    createdAt: Date;
    isRead: boolean;
    senderId?: string;
    sender?: {
        name: string;
        username: string;
        avatar: string;
    };
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const notificationService = {
    getNotifications: (params: Record<string, any> = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/notifications${queryParams ? `?${queryParams}` : ''}`;
        return apiClient.get<NotificationResponse>(url);
    },
    
    markAsRead: (id: string) =>
        apiClient.patch(`/api/notifications/${id}`, { isRead: true }),
    
    markAllAsRead: () =>
        apiClient.patch('/api/notifications/read-all', {}),
    
    deleteNotification: (id: string) =>
        apiClient.delete(`/api/notifications/${id}`),
};
