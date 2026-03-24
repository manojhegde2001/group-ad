'use client';

import { create } from 'zustand';
import type { PostWithRelations } from '@/types';

// ---- Create Post Modal Store ----
interface CreatePostStore {
    isOpen: boolean;
    editingPost: PostWithRelations | null;
    open: (post?: PostWithRelations) => void;
    close: () => void;
    onCreated?: (post: PostWithRelations) => void;
    setOnCreated: (cb: (post: PostWithRelations) => void) => void;
    notifyCreated: (post: PostWithRelations) => void;
    onDeleted?: (postId: string) => void;
    setOnDeleted: (cb: (postId: string) => void) => void;
    notifyDeleted: (postId: string) => void;
}

export const useCreatePost = create<CreatePostStore>((set, get) => ({
    isOpen: false,
    editingPost: null,
    open: (post) => set({ isOpen: true, editingPost: post || null }),
    close: () => set({ isOpen: false, editingPost: null }),
    onCreated: undefined,
    setOnCreated: (cb) => set({ onCreated: cb }),
    notifyCreated: (post) => {
        set({ isOpen: false, editingPost: null });
        get().onCreated?.(post);
    },
    onDeleted: undefined,
    setOnDeleted: (cb) => set({ onDeleted: cb }),
    notifyDeleted: (postId) => {
        get().onDeleted?.(postId);
    },
}));

// ---- Create Event Modal Store ----
interface CreateEventStore {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    onCreated?: (event: any) => void;
    setOnCreated: (cb: (event: any) => void) => void;
    notifyCreated: (event: any) => void;
}

export const useCreateEvent = create<CreateEventStore>((set, get) => ({
    isOpen: false,
    open: () => set({ isOpen: true }),
    close: () => set({ isOpen: false }),
    onCreated: undefined,
    setOnCreated: (cb) => set({ onCreated: cb }),
    notifyCreated: (event) => {
        set({ isOpen: false });
        get().onCreated?.(event);
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
    source: 'feed' | 'drawer' | 'page' | null;
    open: (postId: string, source: 'feed' | 'drawer' | 'page') => void;
    close: () => void;
}

export const useSharePost = create<SharePostStore>((set) => ({
    activePostId: null,
    source: null,
    open: (postId, source) => set({ activePostId: postId, source }),
    close: () => set({ activePostId: null, source: null }),
}));
