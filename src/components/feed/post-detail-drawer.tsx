'use client';

import { useState, useEffect, useRef } from 'react';
import { usePostDetail } from '@/hooks/use-feed';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import {
    X, Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    ChevronLeft, ChevronRight, Loader2, Send, Link2,
    Twitter, Facebook, Check, Video,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
    const [shareOpen, setShareOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const shareRef = useRef<HTMLDivElement>(null);

    // Close share dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
                setShareOpen(false);
            }
        };
        if (shareOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [shareOpen]);

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
            setComments([]);
            setShareOpen(false);

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

    const requireAuth = (cb: () => void) => { if (!user) { openLogin(); return; } cb(); };
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
            const optimistic: Comment = {
                id: Date.now().toString(),
                content: comment.trim(),
                createdAt: new Date().toISOString(),
                user: {
                    id: user.id as string,
                    name: user.name as string,
                    username: (user as any).username,
                    avatar: (user as any).avatar || null,
                },
            };
            setComments((prev) => [optimistic, ...prev]);
            setComment('');
        } finally {
            setSubmittingComment(false);
        }
    };

    const postUrl = typeof window !== 'undefined' && post
        ? `${window.location.origin}/posts/${post.id}`
        : '';
    const postTitle = post?.content?.slice(0, 60) || 'Check out this post';

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
        } catch { }
    };

    if (!isOpen || !post) return null;

    const hasImages = post.images && post.images.length > 0;
    const isVideoPost = post.type === 'VIDEO';
    const isTextPost = !hasImages;
    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-6" onClick={closePost}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" />

            {/* Modal */}
            <div
                className="relative z-10 w-full sm:max-w-5xl h-[95vh] sm:max-h-[94vh] sm:h-auto sm:rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 shadow-2xl animate-slide-up sm:animate-scale-in flex flex-col md:flex-row rounded-t-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag handle — mobile only */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 bg-secondary-200 dark:bg-secondary-700 rounded-full md:hidden z-20" />

                {/* ── Left panel — Media ── */}
                <div
                    className={`relative flex-1 min-h-[220px] md:min-h-0 md:max-h-[94vh] bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center overflow-hidden ${isTextPost ? `bg-gradient-to-br ${gradient}` : ''}`}
                >
                    {loading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-secondary-400" />
                    ) : hasImages ? (
                        <>
                            {isVideoPost ? (
                                <video
                                    src={post.images[currentImageIndex]}
                                    className="w-full h-full object-contain"
                                    controls
                                    playsInline
                                    style={{ maxHeight: '80vh' }}
                                />
                            ) : (
                                <img
                                    src={post.images[currentImageIndex]}
                                    alt={post.content || 'Post image'}
                                    className="w-full h-full object-contain"
                                    style={{ maxHeight: '80vh' }}
                                />
                            )}
                            {post.images.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 hover:bg-black/65 text-white rounded-full flex items-center justify-center transition-colors"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {post.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImageIndex(i)}
                                                className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-5' : 'bg-white/50 w-1.5'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                            {/* Video badge */}
                            {isVideoPost && (
                                <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                    <Video className="w-3 h-3" /> Video
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-8 sm:p-12 text-white">
                            <p className="text-xl sm:text-2xl font-bold leading-relaxed">{post.content}</p>
                        </div>
                    )}
                </div>

                {/* ── Right panel — Details ── */}
                <div className="w-full md:w-[360px] lg:w-[400px] flex flex-col flex-1 md:flex-none overflow-hidden md:max-h-[94vh] bg-white dark:bg-secondary-900">
                    {/* Header row — author + close */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                                src={post.user.avatar ?? undefined}
                                name={post.user.name}
                                size="sm"
                                rounded="full"
                                color="primary"
                            />
                            <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                    <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{post.user.name}</p>
                                    {post.user.verificationStatus === 'VERIFIED' && (
                                        <BadgeCheck className="w-4 h-4 text-primary-500 shrink-0" />
                                    )}
                                </div>
                                <p className="text-xs text-secondary-400 truncate">@{post.user.username}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="outline"
                                color="secondary"
                                size="sm"
                                rounded="pill"
                                className="text-xs px-3 h-7"
                            >
                                Follow
                            </Button>
                            {/* Close button — proper, always aligned */}
                            <button
                                onClick={closePost}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors text-secondary-500"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-secondary-400">
                            {post.category && (
                                <span>{post.category.icon} {post.category.name}</span>
                            )}
                            <span>·</span>
                            <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            <span>·</span>
                            <span>{post.views || 0} views</span>
                        </div>

                        {/* Actions row */}
                        <div className="flex items-center gap-4 py-1">
                            {/* Like */}
                            <button
                                onClick={handleLike}
                                className={`flex items-center gap-1.5 font-medium text-sm transition-all ${liked ? 'text-red-500' : 'text-secondary-500 dark:text-secondary-400 hover:text-red-500'}`}
                            >
                                <Heart className={`w-5 h-5 transition-transform active:scale-125 ${liked ? 'fill-red-500' : ''}`} />
                                <span>{likeCount}</span>
                            </button>

                            {/* Comment count */}
                            <button className="flex items-center gap-1.5 text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-500 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                <span>{(post._count?.postComments || 0) + comments.length}</span>
                            </button>

                            {/* Save */}
                            <button
                                onClick={() => requireAuth(() => setSaved((s) => !s))}
                                className={`flex items-center gap-1.5 text-sm transition-colors ${saved ? 'text-primary-600' : 'text-secondary-500 dark:text-secondary-400 hover:text-primary-500'}`}
                            >
                                <Bookmark className={`w-5 h-5 ${saved ? 'fill-primary-600' : ''}`} />
                            </button>

                            {/* Share dropdown */}
                            <div className="relative ml-auto" ref={shareRef}>
                                <button
                                    onClick={() => setShareOpen((o) => !o)}
                                    className={`text-sm transition-colors ${shareOpen ? 'text-primary-500' : 'text-secondary-500 dark:text-secondary-400 hover:text-primary-500'}`}
                                    title="Share"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>

                                {shareOpen && (
                                    <div className="absolute bottom-8 right-0 z-50 bg-white dark:bg-secondary-800 rounded-xl shadow-2xl border border-secondary-100 dark:border-secondary-700 py-1.5 w-48 animate-scale-in">
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                        >
                                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                            {copied ? 'Copied!' : 'Copy link'}
                                        </button>
                                        <a
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                        >
                                            <Twitter className="w-4 h-4 text-sky-500" />
                                            Share on X
                                        </a>
                                        <a
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                        >
                                            <Facebook className="w-4 h-4 text-blue-600" />
                                            Share on Facebook
                                        </a>
                                        {typeof navigator !== 'undefined' && navigator.share && (
                                            <button
                                                onClick={() => {
                                                    navigator.share({ title: postTitle, url: postUrl });
                                                    setShareOpen(false);
                                                }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                            >
                                                <Share2 className="w-4 h-4" />
                                                More options
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="space-y-3 pt-1">
                            <p className="text-[11px] font-semibold text-secondary-400 uppercase tracking-wide">
                                Comments
                            </p>
                            {comments.map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                    <Avatar
                                        src={c.user.avatar ?? undefined}
                                        name={c.user.name}
                                        size="sm"
                                        rounded="full"
                                        color="primary"
                                        className="w-7 h-7 shrink-0"
                                    />
                                    <div className="flex-1">
                                        <div className="bg-secondary-50 dark:bg-secondary-800 rounded-2xl px-3 py-2">
                                            <p className="text-xs font-semibold text-secondary-800 dark:text-white mb-0.5">{c.user.name}</p>
                                            <p className="text-xs text-secondary-600 dark:text-secondary-400">{c.content}</p>
                                        </div>
                                        <p className="text-[10px] text-secondary-400 mt-0.5 ml-2">
                                            {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {comments.length === 0 && (
                                <p className="text-xs text-secondary-400 text-center py-4">
                                    No comments yet. Be the first!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Comment input */}
                    <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-800 shrink-0">
                        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2.5">
                            <Avatar
                                src={user?.avatar as string | undefined}
                                name={(user?.name as string) || '?'}
                                size="sm"
                                rounded="full"
                                color="primary"
                                className="w-8 h-8 shrink-0"
                            />
                            <div className="flex-1 flex items-center bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 gap-2">
                                <input
                                    type="text"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder={user ? 'Add a comment...' : 'Login to comment'}
                                    className="flex-1 bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 min-w-0"
                                    onClick={() => !user && openLogin()}
                                    readOnly={!user}
                                />
                                {comment.trim() && (
                                    <button
                                        type="submit"
                                        disabled={submittingComment}
                                        className="text-primary-600 hover:text-primary-700 transition-colors shrink-0"
                                        aria-label="Send comment"
                                    >
                                        {submittingComment
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <Send className="w-4 h-4" />
                                        }
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
