'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePostDetail } from '@/hooks/use-feed';
import { useCreatePost } from '@/hooks/use-feed';
import type { PostWithRelations } from '@/types';
import {
    Heart, MessageCircle, Eye, Trash2, Edit3, Globe, Lock,
    ImageOff, Loader2, Plus, MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function MyPostsTab() {
    const { openPost } = usePostDetail();
    const { open: openCreatePost, setOnCreated } = useCreatePost();

    const [posts, setPosts] = useState<PostWithRelations[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

    const fetchMyPosts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/posts/my-posts');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setPosts(data.posts || []);
        } catch {
            toast.error('Failed to load your posts');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyPosts();
    }, [fetchMyPosts]);

    // Prepend newly created post to this list without re-fetching
    useEffect(() => {
        setOnCreated((newPost: PostWithRelations) => {
            setPosts((prev) => [newPost, ...prev]);
        });
    }, [setOnCreated]);

    const handleDelete = async (postId: string) => {
        if (!confirm('Delete this post permanently?')) return;
        setDeletingId(postId);
        setMenuOpenId(null);
        try {
            const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            toast.success('Post deleted');
        } catch {
            toast.error('Failed to delete post');
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleVisibility = async (post: PostWithRelations) => {
        setMenuOpenId(null);
        const newVis = post.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
        try {
            const res = await fetch(`/api/posts/${post.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibility: newVis }),
            });
            if (!res.ok) throw new Error('Failed');
            setPosts((prev) =>
                prev.map((p) => (p.id === post.id ? { ...p, visibility: newVis } : p))
            );
            toast.success(`Post set to ${newVis.toLowerCase()}`);
        } catch {
            toast.error('Failed to update post visibility');
        }
    };

    const filteredPosts = posts.filter((p) => {
        if (filter === 'ALL') return true;
        return p.visibility === filter;
    });

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

    return (
        <div className="p-4 sm:p-6">
            {/* Toolbar */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                    </p>
                    {/* Filter pills */}
                    <div className="flex gap-1.5">
                        {(['ALL', 'PUBLIC', 'PRIVATE'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${filter === f
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-200'
                                    }`}
                            >
                                {f === 'ALL' ? 'All' : f === 'PUBLIC' ? '🌐 Public' : '🔒 Private'}
                            </button>
                        ))}
                    </div>
                </div>
                <Button
                    onClick={openCreatePost}
                    variant="solid"
                    color="primary"
                    size="sm"
                    rounded="pill"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                    New Post
                </Button>
            </div>

            {/* Empty state */}
            {filteredPosts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ImageOff className="w-12 h-12 text-secondary-300 mb-3" />
                    <p className="text-secondary-600 dark:text-secondary-400 font-medium mb-1">
                        {filter === 'ALL' ? 'No posts yet' : `No ${filter.toLowerCase()} posts`}
                    </p>
                    <p className="text-secondary-400 text-sm mb-4">
                        {filter === 'ALL' ? 'Share your first idea with the world!' : `Switch to another filter to see more.`}
                    </p>
                    {filter === 'ALL' && (
                        <Button onClick={openCreatePost} variant="solid" color="primary" size="sm" rounded="pill">
                            Create your first post
                        </Button>
                    )}
                </div>
            )}

            {/* Post Grid — Pinterest-style masonry using columns */}
            {filteredPosts.length > 0 && (
                <div className="columns-2 sm:columns-3 md:columns-4 gap-3">
                    {filteredPosts.map((post) => {
                        const hasImage = post.images && post.images.length > 0;
                        const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

                        return (
                            <div
                                key={post.id}
                                className="mb-3 break-inside-avoid relative group rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => openPost(post.id, post)}
                            >
                                {/* Image / Text banner */}
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

                                {/* Actions — visible on hover */}
                                <div
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                                            className="p-1.5 bg-white/90 hover:bg-white text-secondary-700 rounded-full shadow transition-all"
                                            aria-label="Post options"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {menuOpenId === post.id && (
                                            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-secondary-900 rounded-xl shadow-xl border border-secondary-100 dark:border-secondary-800 overflow-hidden z-10 animate-scale-in">
                                                <button
                                                    onClick={() => handleToggleVisibility(post)}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary-50 dark:hover:bg-secondary-800 text-sm text-secondary-700 dark:text-secondary-300 transition-colors"
                                                >
                                                    {post.visibility === 'PUBLIC'
                                                        ? <><Lock className="w-4 h-4" /><span>Make Private</span></>
                                                        : <><Globe className="w-4 h-4" /><span>Make Public</span></>
                                                    }
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    disabled={deletingId === post.id}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/10 text-sm text-red-500 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === post.id
                                                        ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Deleting…</span></>
                                                        : <><Trash2 className="w-4 h-4" /><span>Delete Post</span></>
                                                    }
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Visibility badge */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${post.visibility === 'PUBLIC'
                                        ? 'bg-green-500/80 text-white'
                                        : 'bg-secondary-700/80 text-white'
                                        }`}>
                                        {post.visibility === 'PUBLIC' ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                                        {post.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                                    </span>
                                </div>

                                {/* Footer stats */}
                                <div className="px-2.5 py-2 flex items-center gap-3 text-xs text-secondary-500 dark:text-secondary-500">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3 h-3" />
                                        {post.likes || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageCircle className="w-3 h-3" />
                                        {post._count?.postComments || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Eye className="w-3 h-3" />
                                        {post.views || 0}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
