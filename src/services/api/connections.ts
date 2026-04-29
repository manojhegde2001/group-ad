import { apiClient } from '@/lib/api-client';

export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED' | null;

export interface Connection {
    id: string;
    senderId: string;
    receiverId: string;
    status: ConnectionStatus;
    createdAt: string;
    updatedAt: string;
    sender?: any;
    receiver?: any;
}

export const connectionService = {
    sendRequest: (receiverId: string, note?: string) => 
        apiClient.post<any>('/api/connections', { receiverId, note }),
        
    updateRequest: (targetUserId: string, action: 'ACCEPT' | 'REJECT') => 
        apiClient.patch<any>(`/api/connections/by-user/${targetUserId}`, { action }),
        
    removeConnection: (targetUserId: string) => 
        apiClient.delete<any>(`/api/connections/by-user/${targetUserId}`),
        
    getConnections: () => 
        apiClient.get<{ connections: Connection[] }>('/api/connections'),
        
    getConnectionWithUser: (userId: string) => 
        apiClient.get<any>(`/api/connections/by-user/${userId}`),
};
