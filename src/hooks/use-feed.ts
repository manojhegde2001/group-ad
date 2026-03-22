'use client';

import { create } from 'zustand';
import type { PostWithRelations } from '@/types';

// ---- Create Post Modal Store ----
interface CreatePostStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    onCreated?: (post: PostWithRelations) => void;
    setOnCreated: (cb: (post: PostWithRelations) => void) => void;
    notifyCreated: (post: PostWithRelations) => void;
}

export const useCreatePost = create<CreatePostStore>((set, get) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    onCreated: undefined,
    setOnCreated: (cb) => set({ onCreated: cb }),
    notifyCreated: (post) => {
        set({ isOpen: false });
        get().onCreated?.(post);
    },
}));

// ---- Post Detail Drawer Store ----
interface PostDetailStore {
    isOpen: boolean;
    postId: string | null;
    post: PostWithRelations | null;
    openPost: (postId: string, post?: PostWithRelations) => void;
    closePost: () => void;
    setPost: (post: PostWithRelations) => void;
}

export const usePostDetail = create<PostDetailStore>((set) => ({
    isOpen: false,
    postId: null,
    post: null,
    openPost: (postId, post) => set({ isOpen: true, postId, post: post || null }),
    closePost: () => set({ isOpen: false, postId: null, post: null }),
    setPost: (post) => set({ post }),
}));

// ---- Feed Filter Store ----
interface FeedFilterStore {
    selectedCategoryId: string | null;
    searchQuery: string;
    setCategory: (categoryId: string | null) => void;
    setSearch: (query: string) => void;
    reset: () => void;
}

export const useFeedFilter = create<FeedFilterStore>((set) => ({
    selectedCategoryId: null,
    searchQuery: '',
    setCategory: (categoryId) => set({ selectedCategoryId: categoryId }),
    setSearch: (query) => set({ searchQuery: query }),
    reset: () => set({ selectedCategoryId: null, searchQuery: '' }),
}));

// ---- Save to Board Modal Store ----
interface SaveToBoardStore {
    isOpen: boolean;
    postId: string | null;
    open: (postId: string) => void;
    close: () => void;
}

export const useSaveToBoard = create<SaveToBoardStore>((set) => ({
    isOpen: false,
    postId: null,
    open: (postId) => set({ isOpen: true, postId }),
    close: () => set({ isOpen: false, postId: null }),
}));

// ---- Share Post Store ----
interface SharePostStore {
    activePostId: string | null;
    open: (postId: string) => void;
    close: () => void;
}

export const useSharePost = create<SharePostStore>((set) => ({
    activePostId: null,
    open: (postId) => set({ activePostId: postId }),
    close: () => set({ activePostId: null }),
}));
