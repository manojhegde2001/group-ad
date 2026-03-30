import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { messageService, Message, Conversation } from '@/services/api/messages';
import toast from 'react-hot-toast';

export const useConversations = (options?: Omit<UseQueryOptions<{ conversations: Conversation[] }>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => messageService.getConversations(),
        ...options,
    });
};

export const useMessages = (
    conversationId: string, 
    params: Record<string, any> = {}, 
    options?: Omit<UseQueryOptions<{ messages: Message[] }>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: ['messages', conversationId, params],
        queryFn: () => messageService.getMessages(conversationId, params),
        enabled: !!conversationId,
        ...options,
    });
};

export const useSendMessage = (conversationId: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { content: string; messageType?: string }) =>
            messageService.sendMessage(conversationId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to send message');
        },
    });
};

export const useMarkMessagesRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId: string) => messageService.markAsRead(conversationId),
        onSuccess: (_, conversationId) => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
            queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
        },
    });
};

export const useUnreadMessagesCount = (options?: Omit<UseQueryOptions<{ count: number }>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['messages', 'unread-count'],
        queryFn: () => messageService.getUnreadCount(),
        ...options,
    });
};

export const useStartConversation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (participantId: string) => messageService.startConversation(participantId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to start conversation');
        },
    });
};
