import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { boardService, Board } from '@/services/api/boards';
import toast from 'react-hot-toast';

export const useBoards = (options?: Omit<UseQueryOptions<{ boards: Board[] }>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['boards'],
        queryFn: () => boardService.getBoards(),
        ...options,
    });
};

export const useBoard = (id: string, options?: Omit<UseQueryOptions<Board>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
        queryKey: ['boards', id],
        queryFn: () => boardService.getBoard(id),
        enabled: !!id,
        ...options,
    });
};

export const useCreateBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            boardService.createBoard(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            toast.success('Board created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create board');
        },
    });
};

export const useUpdateBoard = (id: string) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: { name: string }) =>
            boardService.updateBoard(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            queryClient.invalidateQueries({ queryKey: ['boards', id] });
            toast.success('Board updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update board');
        },
    });
};

export const useDeleteBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => boardService.deleteBoard(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            toast.success('Board deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete board');
        },
    });
};

export const useAddPostToBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, postId }: { boardId: string; postId: string }) =>
            boardService.addPostToBoard(boardId, postId),
        onSuccess: (_, { boardId, postId }) => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            queryClient.invalidateQueries({ queryKey: ['post-boards', postId] });
            toast.success('Added to board');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add to board');
        },
    });
};

export const useRemovePostFromBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, postId }: { boardId: string; postId: string }) =>
            boardService.removePostFromBoard(boardId, postId),
        onSuccess: (_, { boardId, postId }) => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            queryClient.invalidateQueries({ queryKey: ['post-boards', postId] });
            toast.success('Removed from board');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to remove from board');
        },
    });
};

export const useCheckPostInBoards = (postId: string) => {
    return useQuery({
        queryKey: ['post-boards', postId],
        queryFn: () => boardService.checkPostInBoards(postId),
        enabled: !!postId,
    });
};
