'use client';

import { useState, useEffect } from 'react';
import { usePostDetail, useSharePost, useSaveToBoard, useCreatePost } from '@/hooks/use-feed';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import {
    X, Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    ChevronLeft, ChevronRight, Loader2, Send, Link2,
    Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2, Flag, Ban
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { ConnectionButton } from '@/components/profile/connection-button';
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const { open: openSaveToBoard } = useSaveToBoard();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const shareOpen = activePostId === post?.id && (source === 'drawer' || source === 'page');
    const [copied, setCopied] = useState(false);
    
    const { open: openCreatePost } = useCreatePost();
    const deleteMutation = useDeletePost();
    const reportMutation = useReport();
    const blockMutation = useBlock();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    }, [onClose]);

    const requireAuth = (cb: () => void) => { if (!user) { openLogin(); return; } cb(); };

    const handleLike = async () => {
        requireAuth(async () => {
            if (isLiking || !post) return;
            setIsLiking(true);
            const newLiked = !liked;
            setLiked(newLiked);
            setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
            try {
                await fetch(`/api/posts/${post.id}/like`, { method: newLiked ? 'POST' : 'DELETE' });
            } catch {
                // revert
                setLiked(!newLiked);
                setLikeCount((c) => (!newLiked ? c + 1 : Math.max(0, c - 1)));
            } finally {
                setIsLiking(false);
            }
        });
    };

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
        if (!user || !post) { openLogin(); return; }
        if (!comment.trim()) return;
        setSubmittingComment(true);

        // Optimistic UI
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
            // Replace optimistic entry with real one
            setComments((prev) => prev.map((c) => c.id === optimistic.id ? data.comment : c));
        } catch {
            // Remove optimistic on failure
            setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
            toast.error('Failed to post comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const postUrl = typeof window !== 'undefined' && post
        ? `${window.location.origin}/posts/${post.id}` : '';
    const postTitle = post?.content ? post.content.slice(0, 60) : 'Check out this post';

    const safeEncode = (str: string) => {
        try {
            return encodeURIComponent(str.toWellFormed ? str.toWellFormed() : str.replace(/[\uD800-\uDFFF]/g, ''));
        } catch {
            return encodeURIComponent(str.replace(/[^\x00-\x7F]/g, ''));
        }
    };

    const handleShareOpen = (open: boolean | ((prev: boolean) => boolean)) => {
        const nextOpen = typeof open === 'function' ? open(shareOpen) : open;
        if (nextOpen && post) {
            openShare(post.id, isModal ? 'drawer' : 'page');
        } else {
            closeShare();
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => { setCopied(false); closeShare(); }, 1500);
        } catch { }
    };

    const handleReport = () => {
        requireAuth(() => {
            const reason = window.prompt('Please enter a reason for reporting this post:');
            if (reason && post) {
                reportMutation.mutate({ targetType: 'POST', targetId: post.id, reason });
            }
        });
    };

    const handleBlock = () => {
        requireAuth(() => {
            if (post && window.confirm(`Are you sure you want to block ${post.user.name}?`)) {
                blockMutation.mutate(post.user.id);
            }
        });
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
    const isVideoPost = post.type === 'VIDEO';
    const isTextPost = !hasImages;
    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];
    const totalComments = comments.length;

    return (
        <div className="flex flex-col md:flex-row h-full w-full">
            {/* Left Panel - Media */}
            <div
                className={`relative flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-0 bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center overflow-hidden ${isTextPost ? `bg-gradient-to-br ${gradient}` : ''}`}
            >
                {/* Close Button (Mobile Only, or on direct pages) */}
                {onClose && (
                    <button 
                        onClick={onClose}
                        className="md:hidden absolute top-4 left-4 z-[110] p-2.5 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-md text-white transition-all active:scale-95 shadow-lg border border-white/10"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {loading ? (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center gap-4">
                        <Skeleton className="w-full h-full max-h-[80vh] rounded-xl" />
                    </div>
                ) : hasImages ? (
                    <>
                        {(() => {
                            const src = post.images[currentImageIndex];
                            const isVideoItem = src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i);
                            
                            if (isVideoItem) {
                                return (
                                    <video
                                        key={src}
                                        src={src}
                                        className="w-full h-full object-contain"
                                        controls playsInline autoPlay
                                        style={{ maxHeight: '80vh' }}
                                    />
                                );
                            }
                            return (
                                <img
                                    key={src}
                                    src={src}
                                    alt={post.content || 'Post image'}
                                    className="w-full h-full object-contain animate-in fade-in duration-500"
                                    style={{ maxHeight: '80vh' }}
                                />
                            );
                        })()}
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

            {/* Right panel ΓÇö Details */}
            <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-white dark:bg-secondary-900 overflow-hidden relative border-l border-secondary-100 dark:border-secondary-800 ${!isModal ? 'min-h-[600px] md:min-h-0' : ''}`}>
                {/* Desktop Close Button (Only in Modal) */}
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

                {/* Header */}
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
                    <div className="flex items-center gap-2 shrink-0">
                        {user?.id !== post.user.id && (
                            <ConnectionButton 
                                userId={post.user.id} 
                                targetName={post.user.name}
                                initialStatus={(post.user as any).connectionStatus}
                                isInitiator={(post.user as any).connectionInitiator}
                                size="sm"
                            />
                        )}

                        {/* Moderation Actions */}
                        <Popover 
                            isOpen={isMenuOpen} 
                            setIsOpen={setIsMenuOpen}
                            placement="bottom-end"
                        >
                            <Popover.Trigger>
                                <ActionIcon variant="flat" color="secondary" rounded="full" className="w-8 h-8">
                                    <MoreHorizontal className="w-4 h-4" />
                                </ActionIcon>
                            </Popover.Trigger>
                            <Popover.Content className="w-44 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700">
                                <div className="flex flex-col gap-1">
                                    {user && (user.id === post.user.id || (user as any).userType === 'ADMIN') && (
                                        <>
                                            <button 
                                                onClick={() => { openCreatePost(post); setIsMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer text-secondary-900 dark:text-white"
                                            >
                                                <Edit2 className="w-4 h-4" /> Edit Post
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm('Are you sure you want to delete this post?')) {
                                                        deleteMutation.mutate(post.id, {
                                                            onSuccess: () => { if (onClose) onClose(); setIsMenuOpen(false); }
                                                        });
                                                    }
                                                }}
                                                className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete Post
                                            </button>
                                            <div className="h-px bg-secondary-100 dark:bg-secondary-800 my-1 mx-2" />
                                        </>
                                    )}
                                    
                                    <button 
                                        onClick={() => { handleReport(); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer text-secondary-900 dark:text-white"
                                    >
                                        <Flag className="w-4 h-4" /> Report Post
                                    </button>
                                    <button 
                                        onClick={() => { handleBlock(); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors cursor-pointer"
                                    >
                                        <Ban className="w-4 h-4" /> Block User
                                    </button>
                                </div>
                            </Popover.Content>
                        </Popover>
                    </div>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {post.tags.map((tag) => (
                                <span key={tag} className="text-xs text-primary-600 dark:text-primary-400 font-medium">#{tag}</span>
                            ))}
                        </div>
                    )}

                    {/* Caption */}
                    {hasImages && post.content && (
                        <p className="text-sm text-secondary-700 dark:text-secondary-300 leading-relaxed">{post.content}</p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-secondary-400">
                        <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                        <span>┬╖</span>
                        <span>{post.views || 0} views</span>
                        
                        {(post.user.website || post.user.companyWebsite) && (
                            <>
                                <span>┬╖</span>
                                <a 
                                    href={(post.user.website || post.user.companyWebsite!).startsWith('http') ? (post.user.website || post.user.companyWebsite!) : `https://${post.user.website || post.user.companyWebsite!}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:underline font-bold"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Link2 className="w-3 h-3" />
                                    Website
                                </a>
                            </>
                        )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-4 py-1">
                        {/* Like */}
                        <button
                            onClick={handleLike}
                            disabled={isLiking}
                            className={`flex items-center gap-1.5 font-medium text-sm transition-all ${liked ? 'text-red-500' : 'text-secondary-500 dark:text-secondary-400 hover:text-red-500'}`}
                        >
                            <Heart className={`w-5 h-5 transition-transform active:scale-125 ${liked ? 'fill-red-500' : ''}`} />
                            <span>{likeCount}</span>
                        </button>

                        {/* Comment count */}
                        <button className="flex items-center gap-1.5 text-sm text-secondary-500 dark:text-secondary-400 hover:text-primary-500 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span>{totalComments}</span>
                        </button>

                        {/* Save */}
                        <button
                            onClick={() => requireAuth(() => openSaveToBoard(post.id))}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${saved ? 'text-primary-600' : 'text-secondary-500 dark:text-secondary-400 hover:text-primary-500'}`}
                        >
                            <Bookmark className={`w-5 h-5 ${saved ? 'fill-primary-600' : ''}`} />
                        </button>

                        {/* Share */}
                        <Popover isOpen={shareOpen} setIsOpen={handleShareOpen} placement="bottom-end">
                            <Popover.Trigger>
                                <button
                                    className={`ml-auto text-sm transition-colors ${shareOpen ? 'text-primary-500' : 'text-secondary-500 dark:text-secondary-400 hover:text-primary-500'}`}
                                    title="Share"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Content className="z-[9999] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-700 py-2 w-48 p-0 overflow-hidden">
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors border-none bg-transparent"
                                >
                                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${safeEncode(postTitle)}&url=${safeEncode(postUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    <Twitter className="w-4 h-4 text-sky-500" /> Share on X
                                </a>
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${safeEncode(postUrl)}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    <Facebook className="w-4 h-4 text-blue-600" /> Share on Facebook
                                </a>
                                {typeof navigator !== 'undefined' && navigator.share && (
                                    <button
                                        onClick={() => {
                                            navigator.share({ title: postTitle, url: postUrl });
                                            closeShare();
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors border-none bg-transparent"
                                    >
                                        <Share2 className="w-4 h-4" /> More options
                                    </button>
                                )}
                            </Popover.Content>
                        </Popover>
                    </div>

                    {/* Comments */}
                    <div className="space-y-4 pt-2">
                        <p className="text-[11px] font-bold text-secondary-400 uppercase tracking-widest">Comments</p>
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

                {/* Comment input */}
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
                                placeholder={user ? 'Add a commentΓÇª' : 'Login to comment'}
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
            {/* Left Panel - Media Skeleton */}
            <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] md:min-h-0 bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center p-8">
                <Skeleton className="w-full h-full max-h-[80vh] rounded-xl" />
                {onClose && (
                    <button className="md:hidden absolute top-4 left-4 z-[110] p-2.5 rounded-full bg-secondary-200/50 dark:bg-secondary-700/50 backdrop-blur-md text-transparent">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Right panel ΓÇö Details Skeleton */}
            <div className={`w-full md:w-[380px] lg:w-[420px] flex flex-col h-full bg-white dark:bg-secondary-900 overflow-hidden relative border-l border-secondary-100 dark:border-secondary-800 ${!isModal ? 'min-h-[600px] md:min-h-0' : ''}`}>
                {/* Header */}
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

                {/* Body */}
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

                {/* Footer Input */}
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
