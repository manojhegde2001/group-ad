'use client';

import { useState, useEffect } from 'react';
import { usePostDetail } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import {
    X, Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    ChevronLeft, ChevronRight, Loader2, Send, ExternalLink
} from 'lucide-react';
import type { PostWithRelations } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; username: string; avatar: string | null };
}

export function PostDetailDrawer() {
    const { isOpen, post: initialPost, postId, closePost } = usePostDetail();
    const { user } = useAuth();
    const { openLogin } = useAuthModal();

    const [post, setPost] = useState<PostWithRelations | null>(initialPost);
    const [loading, setLoading] = useState(false);
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        if (isOpen && postId) {
            if (initialPost) {
                setPost(initialPost);
                setLikeCount(initialPost.likes || 0);
            }
            setCurrentImageIndex(0);
            setLiked(false);
            setSaved(false);
            setComment('');
            // Fetch full post detail
            setLoading(true);
            fetch(`/api/posts/${postId}`)
                .then((r) => r.json())
                .then((d) => {
                    if (d.post) {
                        setPost(d.post);
                        setLikeCount(d.post.likes || 0);
                    }
                })
                .catch(() => { })
                .finally(() => setLoading(false));
        }
    }, [isOpen, postId]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closePost();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        };
        document.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, currentImageIndex, post]);

    const requireAuth = (cb: () => void) => {
        if (!user) { openLogin(); return; }
        cb();
    };

    const handleLike = () => requireAuth(() => {
        setLiked((l) => !l);
        setLikeCount((c) => liked ? Math.max(0, c - 1) : c + 1);
    });

    const nextImage = () => {
        if (!post?.images?.length) return;
        setCurrentImageIndex((i) => (i + 1) % post.images.length);
    };
    const prevImage = () => {
        if (!post?.images?.length) return;
        setCurrentImageIndex((i) => (i - 1 + post.images.length) % post.images.length);
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) { openLogin(); return; }
        if (!comment.trim()) return;
        setSubmittingComment(true);
        try {
            // Optimistic add
            const optimistic: Comment = {
                id: Date.now().toString(),
                content: comment.trim(),
                createdAt: new Date().toISOString(),
                user: { id: user.id as string, name: user.name as string, username: (user as any).username, avatar: (user as any).avatar || null },
            };
            setComments((prev) => [optimistic, ...prev]);
            setComment('');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (!isOpen || !post) return null;

    const hasImages = post.images && post.images.length > 0;
    const isTextPost = !hasImages;
    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
        'from-emerald-400 to-teal-600', 'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6" onClick={closePost}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative z-10 w-full max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden bg-white dark:bg-secondary-900 shadow-2xl animate-scale-in flex flex-col md:flex-row"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={closePost}
                    className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Left — Image/Text */}
                <div className={`relative flex-1 min-h-[300px] md:min-h-0 bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center ${isTextPost ? `bg-gradient-to-br ${gradient}` : ''}`}>
                    {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-secondary-400" />
                    ) : hasImages ? (
                        <>
                            <img
                                src={post.images[currentImageIndex]}
                                alt={post.content || 'Post image'}
                                className="w-full h-full object-contain"
                                style={{ maxHeight: '80vh' }}
                            />
                            {post.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {post.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`w-2 h-2 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="p-10 text-white">
                            <p className="text-2xl font-bold leading-relaxed">{post.content}</p>
                        </div>
                    )}
                </div>

                {/* Right — Details */}
                <div className="w-full md:w-[380px] flex flex-col">
                    {/* Author */}
                    <div className="p-5 border-b border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
                                {post.user.avatar ? (
                                    <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-white text-sm font-bold">{post.user.name?.charAt(0)?.toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-sm text-secondary-900 dark:text-white">{post.user.name}</p>
                                    {post.user.verificationStatus === 'VERIFIED' && (
                                        <BadgeCheck className="w-4 h-4 text-primary-500" />
                                    )}
                                </div>
                                <p className="text-xs text-secondary-500">@{post.user.username}</p>
                            </div>
                        </div>
                        <button className="px-4 py-1.5 border border-secondary-300 dark:border-secondary-700 rounded-full text-xs font-semibold text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                            Follow
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {post.tags.map((tag) => (
                                    <span key={tag} className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Caption */}
                        {hasImages && post.content && (
                            <p className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">
                                {post.content}
                            </p>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-xs text-secondary-400">
                            {post.category && (
                                <span className="flex items-center gap-1">
                                    {post.category.icon} {post.category.name}
                                </span>
                            )}
                            <span>·</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            <span>·</span>
                            <span>{post.views || 0} views</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 py-1">
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-2 font-medium text-sm transition-all ${liked ? 'text-red-500' : 'text-secondary-600 dark:text-secondary-400 hover:text-red-500'}`}
                            >
                                <Heart className={`w-5 h-5 transition-transform active:scale-125 ${liked ? 'fill-red-500' : ''}`} />
                                <span>{likeCount}</span>
                            </button>
                            <button className="flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-500 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                <span>{(post._count?.postComments || 0) + comments.length}</span>
                            </button>
                            <button
                                onClick={() => requireAuth(() => setSaved((s) => !s))}
                                className={`flex items-center gap-2 text-sm transition-colors ${saved ? 'text-primary-600' : 'text-secondary-600 dark:text-secondary-400 hover:text-primary-500'}`}
                            >
                                <Bookmark className={`w-5 h-5 ${saved ? 'fill-primary-600' : ''}`} />
                            </button>
                            <button className="ml-auto text-secondary-400 hover:text-primary-500 transition-colors">
                                <Share2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Comments */}
                        <div className="space-y-3">
                            <p className="text-xs font-semibold text-secondary-500 uppercase tracking-wide">Comments</p>

                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center shrink-0 text-white text-xs font-bold overflow-hidden">
                                        {c.user.avatar ? <img src={c.user.avatar} alt="" className="w-full h-full object-cover" /> : c.user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-secondary-50 dark:bg-secondary-800 rounded-2xl px-3 py-2">
                                            <p className="text-xs font-semibold text-secondary-800 dark:text-white mb-0.5">{c.user.name}</p>
                                            <p className="text-xs text-secondary-600 dark:text-secondary-400">{c.content}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {comments.length === 0 && (
                                <p className="text-xs text-secondary-400 text-center py-4">No comments yet. Be the first!</p>
                            )}
                        </div>
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 border-t border-secondary-100 dark:border-secondary-800">
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden shrink-0 text-white text-xs font-bold">
                                {user?.avatar ? <img src={user.avatar as string} alt="" className="w-full h-full object-cover" /> : (user?.name as string)?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 flex items-center bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 gap-2">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={user ? 'Add a comment...' : 'Login to comment'}
                                    className="flex-1 bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400"
                                    onClick={() => !user && openLogin()}
                                    readOnly={!user}
                                />
                                {comment.trim() && (
                                    <button
                                        type="submit"
                                        disabled={submittingComment}
                                        className="text-primary-600 hover:text-primary-700 transition-colors"
                                    >
                                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
