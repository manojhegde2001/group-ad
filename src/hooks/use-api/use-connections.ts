import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService, ConnectionStatus } from '@/services/api/connections';
import toast from 'react-hot-toast';

export const useConnections = () => {
    return useQuery({
        queryKey: ['connections'],
        queryFn: () => connectionService.getConnections(),
    });
};

export const useConnectionWithUser = (userId: string) => {
    return useQuery({
        queryKey: ['connections', 'user', userId],
        queryFn: () => connectionService.getConnectionWithUser(userId),
        enabled: !!userId,
    });
};

export const useConnectMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ receiverId, note }: { receiverId: string, note?: string }) => 
            connectionService.sendRequest(receiverId, note),
        onSuccess: (_, { receiverId }) => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['connections', 'user', receiverId] });
            toast.success('Connection request sent');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send request');
        },
    });
};

export const useUpdateConnectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ targetUserId, action }: { targetUserId: string; action: 'ACCEPT' | 'REJECT' }) => 
            connectionService.updateRequest(targetUserId, action),
        onSuccess: (_, { targetUserId, action }) => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['connections', 'user', targetUserId] });
            toast.success(action === 'ACCEPT' ? 'Connection accepted' : 'Request ignored');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Action failed');
        },
    });
};

export const useRemoveConnectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (targetUserId: string) => connectionService.removeConnection(targetUserId),
        onSuccess: (_, targetUserId) => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            queryClient.invalidateQueries({ queryKey: ['connections', 'user', targetUserId] });
            toast.success('Connection removed');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove connection');
        },
    });
};
