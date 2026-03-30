import { apiClient } from '@/lib/api-client';

export interface User {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
    messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
    sender: User;
    readBy: string[];
}

export interface Conversation {
    id: string;
    participants: User[];
    lastMessage: Message | null;
    lastMessageAt: string;
    unreadCount: number;
}

export const messageService = {
    getConversations: () =>
        apiClient.get<{ conversations: Conversation[] }>('/api/conversations'),
    
    getMessages: (conversationId: string, params: Record<string, any> = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const url = `/api/conversations/${conversationId}/messages${queryParams ? `?${queryParams}` : ''}`;
        return apiClient.get<{ messages: Message[] }>(url);
    },
    
    sendMessage: (conversationId: string, data: { content: string; messageType?: string }) =>
        apiClient.post<{ message: Message }>(`/api/conversations/${conversationId}/messages`, data),
    
    markAsRead: (conversationId: string) =>
        apiClient.post(`/api/conversations/${conversationId}/read`, {}),

    getUnreadCount: () =>
        apiClient.get<{ count: number }>('/api/conversations/unread-count'),

    startConversation: (participantId: string) =>
        apiClient.post<{ conversation: Conversation }>('/api/conversations', { participantId }),
};
