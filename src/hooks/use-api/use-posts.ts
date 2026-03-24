import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { postService } from '@/services/api/posts';
import toast from 'react-hot-toast';
import { useCreatePost as usePostStore } from '@/hooks/use-feed';

export const usePosts = (params: Record<string, any> = {}) => {
    return useQuery({
        queryKey: ['posts', params],
        queryFn: () => postService.getPosts(params),
    });
};

export const useInfinitePosts = (params: Record<string, any> = {}, options: any = {}) => {
    return useInfiniteQuery({
        queryKey: ['posts', 'infinite', params],
        queryFn: ({ pageParam = 1 }) => postService.getPosts({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            if (lastPage.pagination.page < lastPage.pagination.totalPages) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        },
        ...options,
    });
};

export const useCreatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: any) => postService.createPost(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post created successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to create post');
        },
    });
};

export const useLikePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
            liked ? postService.likePost(postId) : postService.deleteLike(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            // Optimized update can be done here if needed
        },
    });
};

export const useBookmarkPost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, isBookmarked }: { postId: string, isBookmarked: boolean }) =>
            isBookmarked ? postService.deleteBookmark(postId) : postService.bookmarkPost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Bookmark updated');
        },
    });
};

export const useMyPosts = () => {
    return useQuery({
        queryKey: ['posts', 'my'],
        queryFn: () => postService.getMyPosts(),
    });
};

export const useDeletePost = () => {
    const queryClient = useQueryClient();
    const { notifyDeleted } = usePostStore();

    return useMutation({
        mutationFn: (postId: string) => postService.deletePost(postId),
        onSuccess: (_, postId) => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            notifyDeleted(postId);
            toast.success('Post deleted successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete post');
        },
    });
};

export const useUpdatePost = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ postId, data }: { postId: string; data: any }) =>
            postService.updatePost(postId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Post updated successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update post');
        },
    });
};

export const useSavedPosts = (params: any = {}, options: any = {}) => {
    return useInfiniteQuery({
        queryKey: ['posts', 'saved', params],
        queryFn: ({ pageParam = 1 }) => postService.getSavedPosts({ ...params, page: pageParam }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: any) => {
            if (lastPage.pagination && lastPage.pagination.page < lastPage.pagination.totalPages) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        },
        ...options,
    });
};
