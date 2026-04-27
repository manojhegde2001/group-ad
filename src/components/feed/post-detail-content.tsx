'use client';

import { useState, useEffect, useRef } from 'react';
import { useSharePost, useSaveToBoard, useCreatePostModal } from '@/hooks/use-feed';
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
import { useDeletePost, usePost, usePostComments, useLikePost, useCommentOnPost, useBookmarkPost } from '@/hooks/use-api/use-posts';

import { FeedContainer } from './feed-container';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    // Queries
    const { data: postData, isLoading: loadingPost } = usePost(postId);
    const post = postData?.post || initialPost || null;
    
    const { data: commentsData, isLoading: loadingComments } = usePostComments(postId);
    const comments = ((commentsData as any)?.comments as Comment[]) || [];

    // Mutations
    const likeMutation = useLikePost();
    const commentMutation = useCommentOnPost();
    const bookmarkMutation = useBookmarkPost();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [comment, setComment] = useState('');

    const { open: openSaveToBoard } = useSaveToBoard();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const shareOpen = activePostId === post?.id && (source === 'drawer' || source === 'page');
    const [copied, setCopied] = useState(false);
    
    const { open: openCreatePostModal } = useCreatePostModal();
    const deleteMutation = useDeletePost();
    const reportMutation = useReport();
    const blockMutation = useBlock();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Derived State
    const liked = post?.isLikedByUser || false;
    const likeCount = post?._count?.postLikes ?? (post as any)?.likes ?? 0;
    const saved = (post as any)?.isBookmarked || false;

    // Reset index when postId changes
    useEffect(() => {
        setCurrentImageIndex(0);
        setComment('');
    }, [postId]);

    const [showHeartPop, setShowHeartPop] = useState(false);

    // Keyboard navigation
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) onClose();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'l' || e.key === 'L') handleLike();
        };
        document.addEventListener('keydown', handleKey);
        
        // Fix for "scrolling to bottom" on entry
        window.scrollTo({ top: 0, behavior: 'instant' });
        
        return () => {
            document.removeEventListener('keydown', handleKey);
        };
    }, [onClose]);

    const requireAuth = (cb: () => void) => { if (!user) { openLogin(); return; } cb(); };

    const handleLike = () => {
        requireAuth(() => {
            if (!post) return;
            likeMutation.mutate({ postId: post.id, liked: !liked });
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

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !post) { openLogin(); return; }
        if (!comment.trim()) return;

        commentMutation.mutate(
            { postId: post.id, content: comment.trim() },
            {
                onSuccess: () => {
                    setComment('');
                }
            }
        );
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

    if (loadingPost && !post) {
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
    const totalComments = comments.length;

    return (
        <div className="flex flex-col w-full bg-[#fcfcfc] dark:bg-black min-h-screen antialiased overflow-x-hidden px-2 pt-4 md:px-0 md:pt-4 pb-20">
            {/* Main Post Section */}
            <div className="flex flex-col md:flex-row w-full max-w-[1012px] xl:max-w-[1260px] mx-auto bg-white dark:bg-secondary-900 md:rounded-2xl overflow-hidden md:border border-gray-100 dark:border-secondary-800 md:shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
                
                {/* Left Panel - Sticky Media Column */}
                <div className="relative w-full md:w-[55%] h-auto md:h-[calc(100vh-16px)] md:sticky md:top-4 bg-gray-50 dark:bg-secondary-800/50 overflow-hidden group/carousel">
                    {/* Glass Back Button (Desktop & Mobile) */}
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="absolute top-5 left-5 z-30 p-2.5 rounded-full bg-white/70 hover:bg-white dark:bg-secondary-900/70 dark:hover:bg-secondary-900 backdrop-blur-xl text-gray-900 dark:text-white shadow-xl border border-white/40 dark:border-secondary-700/50 transition-all active:scale-95 group/back"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-6 h-6 group-hover/back:-translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    {hasImages ? (
                        <div className="w-full h-[60vh] md:h-full relative" onDoubleClick={() => { handleLike(); setShowHeartPop(true); setTimeout(() => setShowHeartPop(false), 800); }}>
                            {(() => {
                                const src = post.images[currentImageIndex];
                                const isVideoItem = src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i);
                                
                                if (isVideoItem) {
                                    return (
                                        <video
                                            key={src}
                                            src={src}
                                            className="w-full h-full object-cover block rounded-b-2xl md:rounded-none"
                                            controls playsInline autoPlay loop
                                        />
                                    );
                                }
                                return (
                                    <img
                                        key={src}
                                        src={src}
                                        alt={post.content || 'Post image'}
                                        className="w-full h-full object-cover block rounded-b-2xl md:rounded-none"
                                    />
                                );
                            })()}

                            <AnimatePresence>
                                {showHeartPop && (
                                    <motion.div 
                                        initial={{ scale: 0, opacity: 0 }} 
                                        animate={{ scale: 1.5, opacity: 1 }} 
                                        exit={{ scale: 0, opacity: 0 }} 
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                                    >
                                        <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            {post.images.length > 1 && (
                                <>
                                    {/* Carousel Navigation Arrows */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); prevImage(); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/70 hover:bg-white dark:bg-secondary-900/70 dark:hover:bg-secondary-900 backdrop-blur-md text-gray-900 dark:text-white border border-white/40 dark:border-secondary-700/50 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-20 shadow-xl"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); nextImage(); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/70 hover:bg-white dark:bg-secondary-900/70 dark:hover:bg-secondary-900 backdrop-blur-md text-gray-900 dark:text-white border border-white/40 dark:border-secondary-700/50 opacity-0 group-hover/carousel:opacity-100 transition-all duration-300 z-20 shadow-xl"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* Indicators */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 p-1.5 bg-black/20 backdrop-blur-md rounded-full z-20">
                                        {post.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(i); }}
                                                className={`h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 w-1.5 hover:bg-white/80'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={cn("w-full h-[60vh] md:h-full flex items-center justify-center p-8 text-white text-center rounded-b-2xl md:rounded-none", `bg-gradient-to-br ${gradient}`)}>
                            <p className="text-2xl font-bold leading-tight drop-shadow-md">{post.content}</p>
                        </div>
                    )}
                </div>

                {/* Right panel ΓÇö Details (Independently Scrollable on Desktop) */}
                <div className="w-full md:w-[45%] flex flex-col bg-white dark:bg-secondary-900 h-auto md:h-[calc(100vh-16px)] md:sticky md:top-4">
                    
                    {/* Action Bar / Header */}
                    <div className="flex items-center justify-between p-4 md:p-8 sticky top-0 bg-white dark:bg-secondary-900 z-10">
                        <div className="flex items-center gap-2">
                             <Popover isOpen={shareOpen} setIsOpen={handleShareOpen} placement="bottom-start">
                                <Popover.Trigger>
                                    <ActionIcon variant="text" color="secondary" rounded="full" className="w-10 h-10 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors">
                                        <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </ActionIcon>
                                </Popover.Trigger>
                                <Popover.Content className="z-[9999] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-secondary-700 py-2 w-48 p-0 overflow-hidden">
                                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-secondary-200 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors border-none bg-transparent">
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy link'}
                                    </button>
                                    <a href={`https://twitter.com/intent/tweet?text=${safeEncode(postTitle)}&url=${safeEncode(postUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-secondary-200 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                                        <Twitter className="w-4 h-4 text-sky-500" /> Share on X
                                    </a>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${safeEncode(postUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-secondary-200 hover:bg-gray-50 dark:hover:bg-secondary-700 transition-colors">
                                        <Facebook className="w-4 h-4 text-blue-600" /> Share on Facebook
                                    </a>
                                </Popover.Content>
                            </Popover>

                            <ActionIcon onClick={handleLike} variant="text" rounded="full" className="w-10 h-10 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group/like">
                                <Heart className={cn("w-5 h-5 transition-all duration-200", liked ? "fill-red-500 text-red-500 scale-110" : "text-gray-600 dark:text-gray-300 group-hover/like:text-red-500")} />
                            </ActionIcon>

                            <Popover isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} placement="bottom-start">
                                <Popover.Trigger>
                                    <ActionIcon variant="text" color="secondary" rounded="full" className="w-10 h-10 hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors">
                                        <MoreHorizontal className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </ActionIcon>
                                </Popover.Trigger>
                                <Popover.Content className="w-44 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-secondary-700">
                                    <div className="flex flex-col gap-1">
                                        {user && (user.id === post.user.id || (user as any).userType === 'ADMIN') && (
                                            <>
                                                <button onClick={() => { openCreatePostModal(post); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors text-gray-900 dark:text-white">
                                                    <Edit2 className="w-4 h-4" /> Edit Post
                                                </button>
                                                <button onClick={() => { if (window.confirm('Are you sure?')) deleteMutation.mutate(post.id, { onSuccess: () => onClose?.() }); }} className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" /> Delete Post
                                                </button>
                                                <hr className="border-gray-100 my-1 mx-2" />
                                            </>
                                        )}
                                        <button onClick={() => { handleReport(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-secondary-800 transition-colors text-gray-900 dark:text-white">
                                            <Flag className="w-4 h-4" /> Report
                                        </button>
                                    </div>
                                </Popover.Content>
                            </Popover>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={() => requireAuth(() => openSaveToBoard(post.id))}
                            className={cn(
                                "rounded-full px-6 py-2 text-sm font-semibold transition-all duration-150 active:scale-95",
                                saved 
                                    ? "bg-gray-900 text-white" 
                                    : "bg-[#E60023] text-white hover:bg-[#b5001c]"
                            )}
                        >
                            {saved ? 'Saved ✓' : 'Save'}
                        </button>
                    </div>

                    {/* Metadata Panel (Independently Scrollable) */}
                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-20 scrollbar-hide">
                        
                        {/* Title Section */}
                        <div className="mb-4">
                            <h1 className="text-[22px] font-[600] leading-[1.3] text-gray-900 dark:text-white">
                                {post.content.split('\n')[0]}
                            </h1>
                            {post.content.includes('\n') && (
                                <p className="mt-2 text-[14px] text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {post.content.split('\n').slice(1).join('\n')}
                                </p>
                            )}
                            
                            {/* Likes + Views Stats */}
                            <div className="flex items-center gap-2 mt-4 text-[13px] text-gray-400 font-medium">
                                <button onClick={handleLike} className="flex items-center gap-1.5 hover:text-red-500 transition-colors group/stat">
                                    <Heart className={cn("w-4 h-4 transition-transform group-hover/stat:scale-110", liked && "fill-red-500 text-red-500")} />
                                    <span className={cn(liked && "text-red-500")}>{likeCount} likes</span>
                                </button>
                                <span>·</span>
                                <span>{post.views || 0} views</span>
                                <span>·</span>
                                <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100 dark:border-secondary-800 my-4" />

                        {/* Author Card */}
                        <div className="flex items-center justify-between py-2">
                            <Link href={`/profile/${post.user.username}`} className="flex items-center gap-3 group">
                                <div className="w-[44px] h-[44px] rounded-full bg-gray-100 dark:bg-secondary-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-50 dark:border-secondary-700">
                                    {post.user.avatar ? (
                                        <img src={post.user.avatar} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <span className="text-[14px] font-[500] text-gray-500 uppercase">{post.user.name.charAt(0)}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="inline-flex items-center gap-1">
                                        <span className="font-semibold text-[14px] text-gray-900 dark:text-white truncate group-hover:underline">{post.user.name}</span>
                                        {post.user.verificationStatus === 'VERIFIED' && <BadgeCheck className="w-4 h-4 text-primary-500 shrink-0" />}
                                    </div>
                                    <span className="block text-[12px] text-gray-400 mt-0.5">{(post as any).followerCount || 0} followers</span>
                                </div>
                            </Link>
                            {user?.id !== post.user.id && (
                                <ConnectionButton 
                                    userId={post.user.id} 
                                    targetName={post.user.name}
                                    initialStatus={(post.user as any).connectionStatus}
                                    isInitiator={(post.user as any).connectionInitiator}
                                    className={cn(
                                        "rounded-full font-semibold text-sm px-4 py-1.5 transition-all active:scale-95",
                                        (post.user as any).connectionStatus === 'CONNECTED'
                                            ? "bg-gray-100 text-gray-600 border border-gray-200"
                                            : "border border-gray-900 text-gray-900 bg-white hover:bg-gray-900 hover:text-white"
                                    )}
                                />
                            )}
                        </div>

                        <hr className="border-gray-100 dark:border-secondary-800 my-4" />

                        {/* Tags Chips Section */}
                        {post.tags && post.tags.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 flex-nowrap">
                                    {post.tags.map((tag) => (
                                        <span key={tag} className="rounded-full bg-gray-100 dark:bg-secondary-800 text-gray-700 dark:text-gray-300 text-xs font-medium px-3 py-1.5 whitespace-nowrap hover:bg-gray-200 dark:hover:bg-secondary-700 transition-colors cursor-pointer">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Section */}
                        <div className="mt-6 pb-4">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Comments</h3>
                            
                            {loadingComments ? (
                                <div className="space-y-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-2xl" />)}
                                </div>
                            ) : comments.length === 0 ? (
                                <p className="text-sm text-gray-400 py-4">No comments yet. Share your thoughts!</p>
                            ) : (
                                <div className="space-y-6">
                                    {comments.map((c) => (
                                        <div key={c.id} className="flex gap-3">
                                            <Link href={`/profile/${c.user.username}`} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-secondary-800 shrink-0 overflow-hidden border border-gray-50 dark:border-secondary-700">
                                                {c.user.avatar ? <img src={c.user.avatar} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold text-gray-400">{c.user.name.charAt(0)}</span>}
                                            </Link>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white hover:underline cursor-pointer">{c.user.name}</span>
                                                    <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{c.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pinned Comment Input Row */}
                    <div className="sticky bottom-0 p-4 md:px-8 md:py-6 bg-white dark:bg-secondary-900 border-t border-gray-100 dark:border-secondary-800 z-20">
                        {post.commentsEnabled !== false ? (
                            <form onSubmit={handleCommentSubmit} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-secondary-800 shrink-0 overflow-hidden">
                                    {user?.avatar ? <img src={user.avatar as string} className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xs font-bold text-gray-400">?</span>}
                                </div>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Add a comment"
                                        className="w-full bg-white dark:bg-secondary-800 border border-gray-200 dark:border-secondary-700 rounded-full py-2.5 px-4 pr-14 text-sm focus:outline-none focus-visible:ring-2 ring-gray-300 dark:ring-secondary-600 text-gray-900 dark:text-white transition-all"
                                    />
                                    {comment.trim() && (
                                        <button
                                            type="submit"
                                            disabled={commentMutation.isPending}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E60023] font-semibold text-sm hover:text-[#b5001c] transition-colors"
                                        >
                                            {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <p className="text-xs text-center text-gray-400 font-medium py-1">Comments are disabled for this post</p>
                        )}
                    </div>
                </div>
            </div>

            {/* More to Explore Section */}
            <div className="mt-12 w-full max-w-[1260px] mx-auto px-4 pb-20">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">More to explore</h2>
                    <p className="text-sm text-gray-400 mt-1">Related posts you might like</p>
                </div>
                
                <div className="w-full">
                    <FeedContainer categoryId={post.categoryId} />
                </div>
            </div>
        </div>
    );
}

function PostDetailSkeleton({ isModal, onClose }: { isModal: boolean; onClose?: () => void }) {
    return (
        <div className="flex flex-col w-full min-h-screen bg-white dark:bg-secondary-900 animate-pulse antialiased">
            <div className="flex flex-col md:flex-row w-full max-w-[1260px] mx-auto md:border border-gray-100 dark:border-secondary-800">
                <div className="w-full md:w-[55%] h-[60vh] md:h-[100vh] bg-gray-100 dark:bg-secondary-800" />
                <div className="w-full md:w-[45%] flex flex-col">
                    <div className="p-8 space-y-8">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-10 w-32 rounded-full" />
                            <Skeleton className="h-10 w-24 rounded-full" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-3/4 rounded-lg" />
                            <Skeleton className="h-4 w-1/2 rounded-lg" />
                        </div>
                        <hr className="border-gray-100" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-11 w-11 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3 rounded" />
                                <Skeleton className="h-3 w-1/4 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
