import { apiClient } from '@/lib/api-client';

export const postService = {
    getPosts: (params: Record<string, any>) => {
        const searchParams = new URLSearchParams(params);
        return apiClient.get(`/api/posts?${searchParams.toString()}`);
    },
    createPost: (data: any) => apiClient.post('/api/posts', data),
    likePost: (postId: string) => apiClient.post(`/api/posts/${postId}/like`),
    deleteLike: (postId: string) => apiClient.delete(`/api/posts/${postId}/like`),
    bookmarkPost: (postId: string) => apiClient.post<any>(`/api/posts/${postId}/bookmark`),
    deleteBookmark: (postId: string) => apiClient.delete<any>(`/api/posts/${postId}/bookmark`),
    getPostComments: (postId: string) => apiClient.get(`/api/posts/${postId}/comments`),
    commentOnPost: (postId: string, content: string) =>
        apiClient.post<any>(`/api/posts/${postId}/comments`, { content }),
    getMyPosts: () => apiClient.get<any>('/api/posts/my-posts'),
    getSavedPosts: (params: any = {}) => apiClient.get<any>('/api/bookmarks', { ...params }),
    deletePost: (postId: string) => apiClient.delete<any>(`/api/posts/${postId}`),
    updatePost: (postId: string, data: any) => apiClient.patch<any>(`/api/posts/${postId}`, data),
};
