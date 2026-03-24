'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { usePostDetail, useSharePost, useSaveToBoard, useCreatePost } from '@/hooks/use-feed';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import {
    X, Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    ChevronLeft, ChevronRight, Loader2, Send, Link2,
    Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2, Flag, Ban, ArrowLeft
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ActionIcon } from '@/components/ui/action-icon';
import { Skeleton } from '@/components/ui/skeleton';
import type { PostWithRelations } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Popover } from 'rizzui';
import { useReport, useBlock } from '@/hooks/use-api/use-moderation';
import { useDeletePost } from '@/hooks/use-api/use-posts';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    user: { id: string; name: string; username: string; avatar: string | null };
}

interface PostDetailContentProps {
    postId: string;
    post?: PostWithRelations | null;
    isModal?: boolean;
    onClose?: () => void;
}

export function PostDetailContent({ postId, post: initialPost, isModal = false, onClose }: PostDetailContentProps) {
    const { user } = useAuth();
    const { openLogin } = useAuthModal();

    const [post, setPost] = useState<PostWithRelations | null>(initialPost || null);
    const [loading, setLoading] = useState(!initialPost);
    const [liked, setLiked] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const { open: openSaveToBoard } = useSaveToBoard();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const shareOpen = activePostId === post?.id && (source === 'drawer' || source === 'page');
    const [copied, setCopied] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const { open: openCreatePost } = useCreatePost();
    const deleteMutation = useDeletePost();
    const reportMutation = useReport();
    const blockMutation = useBlock();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Embla Carousel
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop: true,
        duration: 25,
        dragFree: false,
        containScroll: 'trimSnaps'
    });
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setCurrentImageIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        onSelect();
        emblaApi.on('select', onSelect);
        return () => {
            emblaApi.off('select', onSelect);
        };
    }, [emblaApi, onSelect]);

    const nextImage = useCallback(() => {
        if (emblaApi) emblaApi.scrollNext();
    }, [emblaApi]);

    const prevImage = useCallback(() => {
        if (emblaApi) emblaApi.scrollPrev();
    }, [emblaApi]);

    // Fetch post + comments when opened
    useEffect(() => {
        if (!postId) return;

        setCurrentImageIndex(0);
        setComment('');

        // Seed from cached post while we fetch fresh data
        if (initialPost) {
            setPost(initialPost);
            setLikeCount(initialPost._count?.postLikes ?? (initialPost as any).likes ?? 0);
            setLiked((initialPost as any).isLikedByUser ?? false);
            setSaved((initialPost as any).isBookmarked ?? false);
        }

        // Fetch fresh post data
        if (!initialPost) setLoading(true);
        fetch(`/api/posts/${postId}`)
            .then((r) => r.json())
            .then((d) => {
                if (d.post) {
                    setPost(d.post);
                    setLikeCount(d.post._count?.postLikes ?? d.post.likes ?? 0);
                    setLiked(d.post.isLikedByUser ?? false);
                    setSaved(d.post.isBookmarked ?? false);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));

        // Fetch comments
        setLoadingComments(true);
        setComments([]);
        fetch(`/api/posts/${postId}/comments`)
            .then((r) => r.json())
            .then((d) => { if (d.comments) setComments(d.comments); })
            .catch(() => { })
            .finally(() => setLoadingComments(false));

    }, [postId, initialPost]);

    // Fetch follow status
    useEffect(() => {
        if (!post || !user || post.user.id === user.id) return;

        fetch(`/api/users/${post.user.id}/follow`)
            .then((r) => r.json())
            .then((d) => {
                if (typeof d.isFollowing === 'boolean') setIsFollowing(d.isFollowing);
            })
            .catch(() => { });
    }, [post?.user?.id, user?.id]);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) onClose();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
        };
        document.addEventListener('keydown', handleKey);
        return () => {
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose, prevImage, nextImage]);

    const requireAuth = (cb: () => void) => { if (!user) { openLogin(); return; } cb(); };

    const handleLike = async () => {
        requireAuth(async () => {
            if (isLiking || !post) return;
            setIsLiking(true);
            const newLiked = !liked;
            setLiked(newLiked);
            setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
            try {
                const res = await fetch(`/api/posts/${post.id}/like`, { method: newLiked ? 'POST' : 'DELETE' });
                if (!res.ok) throw new Error();
            } catch {
                setLiked(!newLiked);
                setLikeCount((c) => (!newLiked ? c + 1 : Math.max(0, c - 1)));
            } finally {
                setIsLiking(false);
            }
        });
    };

    const handleFollow = async () => {
        requireAuth(async () => {
            if (isFollowLoading || !post) return;
            setIsFollowLoading(true);
            const nextFollowState = !isFollowing;

            // Optimistic UI
            setIsFollowing(nextFollowState);

            try {
                const res = await fetch(`/api/users/${post.user.id}/follow`, {
                    method: nextFollowState ? 'POST' : 'DELETE',
                });
                if (!res.ok) throw new Error();
                toast.success(nextFollowState ? `Following ${post.user.name}` : `Unfollowed ${post.user.name}`);
            } catch {
                // Revert
                setIsFollowing(!nextFollowState);
                toast.error('Failed to update follow status');
            } finally {
                setIsFollowLoading(false);
            }
        });
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !post) { openLogin(); return; }
        if (!comment.trim()) return;
        setSubmittingComment(true);

        const optimistic: Comment = {
            id: `opt-${Date.now()}`,
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

        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: optimistic.content }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setComments((prev) => prev.map((c) => c.id === optimistic.id ? data.comment : c));
        } catch {
            setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
            toast.error('Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    if (loading && !post) {
        return <PostDetailSkeleton isModal={isModal} onClose={onClose} />;
    }

    if (!post) {
        return (
            <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-white dark:bg-secondary-900 rounded-2xl min-h-[400px]">
                <div className="w-16 h-16 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-secondary-400" />
                </div>
                <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">Post not found</h3>
                <p className="text-secondary-500 dark:text-secondary-400 max-w-xs mb-6">This post may have been deleted or the link is incorrect.</p>
                {onClose && (
                    <Button onClick={onClose} variant="flat" rounded="pill">
                        Go Back
                    </Button>
                )}
            </div>
        );
    }

    const hasImages = post.images && post.images.length > 0;
    const isTextPost = !hasImages;
    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    return (
        <div className="flex flex-col md:flex-row h-full w-full">
            {/* Left Panel - Media Carousel */}
            <div
                className={`relative flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-0 bg-secondary-950 flex items-center justify-center overflow-hidden group/panel ${isTextPost ? `bg-gradient-to-br ${gradient}` : ''}`}
            >
                {/* Close Button (Mobile Only) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="md:hidden absolute top-4 left-4 z-[110] p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-xl transition-all active:scale-90"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}

                {hasImages ? (
                    <div className="w-full h-full relative">
                        <div className="w-full h-full overflow-hidden" ref={emblaRef}>
                            <div className="flex w-full h-full">
                                {post.images.map((src, idx) => {
                                    const isVideoItem = src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i);
                                    return (
                                        <div key={idx} className="flex-[0_0_100%] min-w-0 h-full relative flex items-center justify-center bg-black">
                                            {isVideoItem ? (
                                                <video
                                                    src={src}
                                                    className="w-full h-full object-contain"
                                                    controls playsInline autoPlay
                                                    style={{ maxHeight: '80vh' }}
                                                />
                                            ) : (
                                                <img
                                                    src={src}
                                                    alt={`Image ${idx + 1}`}
                                                    className="w-full h-full object-contain"
                                                    style={{ maxHeight: '80vh' }}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {post.images.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-panel:opacity-100 transition-opacity active:scale-90 hidden md:flex items-center justify-center shadow-2xl"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white opacity-0 group-panel:opacity-100 transition-opacity active:scale-90 hidden md:flex items-center justify-center shadow-2xl"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10">
                                    {post.images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); emblaApi?.scrollTo(i); }}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentImageIndex ? 'bg-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'bg-white/40 hover:bg-white/60'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="p-8 sm:p-12 text-white">
                        <p className="text-xl sm:text-2xl font-bold leading-relaxed">{post.content}</p>
                    </div>
                )}
            </div>

            {/* Right panel — Details */}
            <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-white dark:bg-secondary-900 overflow-hidden relative border-l border-secondary-100 dark:border-secondary-800 ${!isModal ? 'min-h-[600px] md:min-h-0' : ''}`}>
                {isModal && onClose && (
                    <div className="absolute top-4 right-4 z-50 hidden sm:block">
                        <ActionIcon
                            variant="flat"
                            color="secondary"
                            rounded="full"
                            onClick={onClose}
                            className="bg-secondary-100/80 hover:bg-secondary-200 dark:bg-secondary-800/80 dark:hover:bg-secondary-700 shadow-sm"
                        >
                            <X className="w-4 h-4" />
                        </ActionIcon>
                    </div>
                )}

                <div className="flex items-center justify-between px-4 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0 sm:pr-14 pr-4">
                    <Link
                        href={`/profile/${post.user.username}`}
                        className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
                    >
                        <Avatar
                            src={post.user.avatar ?? undefined}
                            name={post.user.name}
                            size="sm" rounded="full" color="primary"
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
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {post.content && (
                        <div className="mb-6">
                            <p className="text-sm text-secondary-800 dark:text-secondary-100 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            <p className="text-[10px] text-secondary-400 mt-2 uppercase tracking-widest font-bold">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    )}

                    <div className="flex items-center gap-6 py-2 border-y border-secondary-50 dark:border-secondary-800">
                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center gap-1.5 transition-all active:scale-95 ${liked ? 'text-rose-500' : 'text-secondary-500 hover:text-rose-500'}`}
                        >
                            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                            <span className="text-xs font-bold">{likeCount}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-secondary-500">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-xs font-bold">{comments.length}</span>
                        </div>
                        <button
                            onClick={handleFollow}
                            disabled={isFollowLoading}
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${isFollowing ? 'border-secondary-200 text-secondary-400' : 'border-primary-500 text-primary-500 hover:bg-primary-50'}`}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>

                    <div className="space-y-4 pt-2">
                        {loadingComments ? (
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex gap-3">
                                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <Skeleton className="h-3 w-24 rounded" />
                                            <Skeleton className="h-10 w-full rounded-2xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-xs text-secondary-400 text-center py-4">No comments yet. Be the first!</p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="flex gap-2.5">
                                    <Avatar
                                        src={c.user.avatar ?? undefined}
                                        name={c.user.name}
                                        size="sm" rounded="full" color="primary"
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
                            ))
                        )}
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-800 shrink-0">
                    <form onSubmit={handleCommentSubmit} className="flex items-center gap-2.5">
                        <Avatar
                            src={(user?.avatar as string | null | undefined) ?? undefined}
                            name={(user?.name as string) || '?'}
                            size="sm" rounded="full" color="primary"
                            className="w-8 h-8 shrink-0"
                        />
                        <div className="flex-1 flex items-center bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 gap-2">
                            <input
                                type="text"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={user ? 'Add a comment…' : 'Login to comment'}
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
    );
}

function PostDetailSkeleton({ isModal, onClose }: { isModal: boolean; onClose?: () => void }) {
    return (
        <div className="flex flex-col md:flex-row h-full w-full animate-pulse">
            <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-0 bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center p-8">
                <Skeleton className="w-full h-full max-h-[80vh] rounded-xl" />
                {onClose && (
                    <button className="md:hidden absolute top-4 left-4 z-[110] p-2.5 rounded-full bg-secondary-200/50 dark:bg-secondary-700/50 backdrop-blur-md text-transparent">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
            </div>

            <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-white dark:bg-secondary-900 overflow-hidden relative border-l border-secondary-100 dark:border-secondary-800 ${!isModal ? 'min-h-[600px] md:min-h-0' : ''}`}>
                <div className="flex items-center justify-between px-4 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-24 rounded" />
                            <Skeleton className="h-2 w-16 rounded" />
                        </div>
                    </div>
                    <Skeleton className="h-8 w-20 rounded-full" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded" />
                        <Skeleton className="h-4 w-[90%] rounded" />
                        <Skeleton className="h-4 w-[40%] rounded" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-5 w-12 rounded" />
                        <Skeleton className="h-5 w-12 rounded" />
                        <Skeleton className="h-5 w-12 rounded" />
                    </div>
                    <div className="space-y-4 pt-4 border-t border-secondary-50 dark:border-secondary-800">
                        <Skeleton className="h-3 w-20 rounded" />
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2 pt-1">
                                    <Skeleton className="h-3 w-24 rounded" />
                                    <Skeleton className="h-10 w-full rounded-2xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-secondary-100 dark:border-secondary-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <Skeleton className="h-9 w-full rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
