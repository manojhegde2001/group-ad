import { useQuery, useMutation, useQueryClient, UseQueryOptions, QueryClient } from '@tanstack/react-query';
import { boardService, Board } from '@/services/api/boards';
import toast from 'react-hot-toast';

type PostBoardsData = { boardIds: string[] };

// Surgically patches the cached `isSaved` flag on a post wherever it appears
// (feed lists, infinite feeds, post detail) instead of refetching everything.
function setPostSavedState(queryClient: QueryClient, postId: string, isSaved: boolean) {
    const patchPost = (post: any) => (post && post.id === postId ? { ...post, isSaved } : post);

    queryClient.setQueriesData<any>({ queryKey: ['posts'] }, (old: any) => {
        if (!old) return old;
        if (Array.isArray(old.posts)) {
            return { ...old, posts: old.posts.map(patchPost) };
        }
        if (old.post) {
            return { ...old, post: patchPost(old.post) };
        }
        if (Array.isArray(old.pages)) {
            return {
                ...old,
                pages: old.pages.map((page: any) =>
                    Array.isArray(page?.posts) ? { ...page, posts: page.posts.map(patchPost) } : page
                ),
            };
        }
        return old;
    });
}

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
        onMutate: async ({ boardId, postId }) => {
            await queryClient.cancelQueries({ queryKey: ['post-boards', postId] });
            const previous = queryClient.getQueryData<PostBoardsData>(['post-boards', postId]);

            queryClient.setQueryData<PostBoardsData>(['post-boards', postId], (old) => ({
                boardIds: Array.from(new Set([...(old?.boardIds || []), boardId])),
            }));
            setPostSavedState(queryClient, postId, true);

            return { previous };
        },
        onError: (error: any, { postId }, context) => {
            queryClient.setQueryData(['post-boards', postId], context?.previous);
            setPostSavedState(queryClient, postId, (context?.previous?.boardIds.length ?? 0) > 0);
            toast.error(error.message || 'Failed to add to board');
        },
        onSuccess: (_, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            toast.success('Added to board');
        },
        onSettled: (_, __, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['post-boards', postId] });
        },
    });
};

export const useRemovePostFromBoard = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ boardId, postId }: { boardId: string; postId: string }) =>
            boardService.removePostFromBoard(boardId, postId),
        onMutate: async ({ boardId, postId }) => {
            await queryClient.cancelQueries({ queryKey: ['post-boards', postId] });
            const previous = queryClient.getQueryData<PostBoardsData>(['post-boards', postId]);
            const nextBoardIds = (previous?.boardIds || []).filter((id) => id !== boardId);

            queryClient.setQueryData<PostBoardsData>(['post-boards', postId], { boardIds: nextBoardIds });
            setPostSavedState(queryClient, postId, nextBoardIds.length > 0);

            return { previous };
        },
        onError: (error: any, { postId }, context) => {
            queryClient.setQueryData(['post-boards', postId], context?.previous);
            setPostSavedState(queryClient, postId, (context?.previous?.boardIds.length ?? 0) > 0);
            toast.error(error.message || 'Failed to remove from board');
        },
        onSuccess: (_, { boardId }) => {
            queryClient.invalidateQueries({ queryKey: ['boards'] });
            queryClient.invalidateQueries({ queryKey: ['boards', boardId] });
            toast.success('Removed from board');
        },
        onSettled: (_, __, { postId }) => {
            queryClient.invalidateQueries({ queryKey: ['post-boards', postId] });
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
