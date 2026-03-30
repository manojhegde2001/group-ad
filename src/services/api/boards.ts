import { apiClient } from '@/lib/api-client';

export interface Board {
    id: string;
    name: string;
    description?: string | null;
    userId: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        posts: number;
    };
    posts?: {
        post: {
            images: string[];
        };
    }[];
}

export const boardService = {
    getBoards: () => apiClient.get<{ boards: Board[] }>('/api/boards'),
    
    getBoard: (id: string) => apiClient.get<Board>(`/api/boards/${id}`),
    
    createBoard: (data: { name: string; description?: string }) =>
        apiClient.post<Board>('/api/boards', data),
    
    updateBoard: (id: string, data: { name: string }) =>
        apiClient.patch<Board>(`/api/boards/${id}`, data),
    
    deleteBoard: (id: string) =>
        apiClient.delete(`/api/boards/${id}`),
    
    addPostToBoard: (boardId: string, postId: string) =>
        apiClient.post(`/api/boards/${boardId}/posts`, { postId }),
    
    removePostFromBoard: (boardId: string, postId: string) =>
        apiClient.delete(`/api/boards/${boardId}/posts?postId=${postId}`),

    checkPostInBoards: (postId: string) =>
        apiClient.get<{ boardIds: string[] }>(`/api/boards/check?postId=${postId}`),
};
