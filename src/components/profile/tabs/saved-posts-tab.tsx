'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePostDetail } from '@/hooks/use-feed';
import { Bookmark, ImageOff, Loader2, X } from 'lucide-react';
import type { PostWithRelations } from '@/types';
import toast from 'react-hot-toast';

export default function SavedPostsTab() {
    const { openPost } = usePostDetail();
    const [posts, setPosts] = useState<PostWithRelations[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSaved = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookmarks?limit=50');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch {
            toast.error('Failed to load saved posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSaved(); }, [fetchSaved]);

    const handleUnsave = async (postId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setPosts((prev) => prev.filter((p) => p.id !== postId));
        try {
            const res = await fetch(`/api/bookmarks/${postId}`, { method: 'DELETE' });
            if (!res.ok) {
                await fetchSaved(); // re-fetch on error
                toast.error('Failed to remove bookmark');
            }
        } catch {
            await fetchSaved();
        }
    };

    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];

    if (loading) {
        return (
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className={`rounded-xl bg-secondary-100 dark:bg-secondary-800 animate-pulse ${i % 3 === 0 ? 'h-48' : i % 3 === 1 ? 'h-32' : 'h-40'}`}
                    />
                ))}
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <Bookmark className="w-12 h-12 text-secondary-300 mb-3" />
                <p className="text-secondary-700 dark:text-secondary-300 font-medium mb-1">No saved posts yet</p>
                <p className="text-secondary-400 text-sm">Bookmark posts from the feed and they'll appear here.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6">
            <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300 mb-5">
                {posts.length} saved {posts.length === 1 ? 'post' : 'posts'}
            </p>

            <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
                {posts.map((post) => {
                    const hasImage = post.images && post.images.length > 0;
                    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

                    return (
                        <div
                            key={post.id}
                            className="mb-3 break-inside-avoid relative group rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                            onClick={() => openPost(post.id, post)}
                        >
                            {hasImage ? (
                                <img
                                    src={post.images[0]}
                                    alt={post.content?.slice(0, 60) || 'Post'}
                                    className="w-full h-auto object-cover block"
                                    loading="lazy"
                                />
                            ) : (
                                <div className={`w-full min-h-[120px] bg-gradient-to-br ${gradient} p-4 flex items-start`}>
                                    <p className="text-white text-sm font-semibold leading-snug line-clamp-6">
                                        {post.content}
                                    </p>
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 pointer-events-none" />

                            {/* Unsave button */}
                            <div
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={(e) => handleUnsave(post.id, e)}
                                    title="Remove bookmark"
                                    className="p-1.5 bg-white/90 hover:bg-red-50 text-secondary-700 hover:text-red-500 rounded-full shadow transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Author */}
                            <div className="px-2.5 py-2 flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full overflow-hidden bg-primary-100 shrink-0">
                                    {post.user.avatar ? (
                                        <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-primary-600">
                                            {post.user.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-secondary-600 dark:text-secondary-400 truncate">{post.user.name}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
