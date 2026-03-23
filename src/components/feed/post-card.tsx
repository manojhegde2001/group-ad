'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { usePostDetail, useSaveToBoard, useSharePost, useCreatePost } from '@/hooks/use-feed';
import { useLikePost, useDeletePost } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { Popover, Dropdown } from 'rizzui';
import { ActionIcon } from '../ui/action-icon';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
    post: PostWithRelations;
    onLikeChange?: (postId: string, liked: boolean) => void;
    showActions?: boolean;
}

export function PostCard({ post, onLikeChange, showActions = false }: PostCardProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const { openPost } = usePostDetail();
    const { open: openSaveToBoard } = useSaveToBoard();
    const { open: openCreatePost } = useCreatePost();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const likeMutation = useLikePost();
    const deletePostMutation = useDeletePost();

    // ── Local optimistic like state ──────────────────────────────────────────
    const [liked, setLiked] = useState<boolean>((post as any).isLikedByUser ?? false);
    const [likeCount, setLikeCount] = useState<number>(
        post._count?.postLikes ?? (post as any).likes ?? 0
    );
    const [showHeartPop, setShowHeartPop] = useState(false);

    // Sync if parent data changes
    useEffect(() => {
        setLiked((post as any).isLikedByUser ?? false);
        setLikeCount(post._count?.postLikes ?? (post as any).likes ?? 0);
    }, [(post as any).isLikedByUser, post._count?.postLikes]);

    const saved = (post as any).isBookmarked ?? false;
    const shareOpen = activePostId === post.id && source === 'feed';
    const [copied, setCopied] = useState(false);

    const handleShareOpen = (open: boolean | ((prev: boolean) => boolean)) => {
        const nextOpen = typeof open === 'function' ? open(shareOpen) : open;
        if (nextOpen) {
            openShare(post.id, 'feed');
        } else {
            closeShare();
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const requireAuth = (cb: () => void) => {
        if (!user) { openLogin(); return; }
        cb();
    };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => {
            if (likeMutation.isPending) return;
            const newLiked = !liked;
            // Optimistically update local state immediately
            setLiked(newLiked);
            setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
            onLikeChange?.(post.id, newLiked);
            likeMutation.mutate(
                { postId: post.id, liked: newLiked },
                {
                    onError: () => {
                        // Revert on failure
                        setLiked(!newLiked);
                        setLikeCount(c => !newLiked ? c + 1 : Math.max(0, c - 1));
                    },
                }
            );
        });
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => openSaveToBoard(post.id));
    };

    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
    const postTitle = post.content ? post.content.slice(0, 60) : 'Check out this post';

    const safeEncode = (str: string) => {
        try {
            return encodeURIComponent(str.toWellFormed ? str.toWellFormed() : str.replace(/[\uD800-\uDFFF]/g, ''));
        } catch {
            return encodeURIComponent(str.replace(/[^\x00-\x7F]/g, ''));
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => { setCopied(false); closeShare(); }, 1500);
        } catch { /* noop */ }
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!liked) {
            handleLike(e);
        }
        setShowHeartPop(true);
        setTimeout(() => setShowHeartPop(false), 800);
    };

    const handleCardClick = () => requireAuth(() => openPost(post.id, post));

    const hasImage = post.images && post.images.length > 0;
    const isVideoPost = post.type === 'VIDEO';
    const commentCount = post._count?.postComments ?? 0;

    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    if (!mounted) return null;

    return (
        <div
            className="group relative rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 cursor-pointer
                shadow-[0_1px_6px_rgba(0,0,0,0.07)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]
                dark:shadow-[0_1px_6px_rgba(0,0,0,0.35)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.55)]
                transition-all duration-300 hover:-translate-y-[3px]"
            onClick={handleCardClick}
        >
            {/* ── Media ───────────────────────────────────────────────── */}
            <div className="relative overflow-hidden">
                {hasImage ? (
                    <div className="relative">
                        {isVideoPost ? (
                            <>
                                <video
                                    src={post.images[0]}
                                    className="w-full h-auto object-cover block"
                                    muted playsInline loop preload="metadata"
                                    onMouseEnter={e => e.currentTarget.play()}
                                    onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    onDoubleClick={handleDoubleTap}
                                />
                                <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1.5 font-bold z-10 border border-white/10">
                                    <Video className="w-3 h-3" /> Video
                                </div>
                            </>
                        ) : (
                            <img
                                src={post.images[0]}
                                alt={post.content?.slice(0, 80) || 'Post image'}
                                className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-[1.05]"
                                loading="lazy"
                                onDoubleClick={handleDoubleTap}
                            />
                        )}
                        {!isVideoPost && post.images.length > 1 && (
                            <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded-lg font-black z-10 border border-white/10 uppercase tracking-widest leading-none">
                                {post.images.length} Photos
                            </div>
                        )}

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
                    </div>
                ) : (
                    <div className={`w-full min-h-[150px] bg-gradient-to-br ${gradient} p-4 flex items-start`}>
                        <p className="text-white text-sm font-semibold leading-snug line-clamp-6">
                            {post.content}
                        </p>
                    </div>
                )}

                {/* --- Ownership Actions (Meatball Menu) --- */}
                {showActions && user?.id === post.userId && (
                    <div className="absolute top-3 right-3 z-30" onClick={e => e.stopPropagation()}>
                        <Dropdown placement="bottom-end">
                            <Dropdown.Trigger>
                                <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 shrink-0 transition-all cursor-pointer">
                                    <MoreHorizontal className="w-4 h-4" />
                                </span>
                            </Dropdown.Trigger>
                            <Dropdown.Menu className="w-40 p-1">
                                <Dropdown.Item 
                                    onClick={() => openCreatePost(post)}
                                    className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary-100 cursor-pointer text-secondary-900 dark:text-white"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Post
                                </Dropdown.Item>
                                <Dropdown.Item 
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this post?')) {
                                            deletePostMutation.mutate(post.id);
                                        }
                                    }}
                                    className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                )}

                {/* Hover vignette */ }
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* ── Hover action bar (bottom) ────────────────────────── */ }
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between
                    opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0
                    transition-all duration-200 z-20">

                    {/* Like */}
                    <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        title={liked ? 'Unlike' : 'Like'}
                        className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-black uppercase tracking-wider
                            transition-all duration-300 active:scale-90 backdrop-blur-xl shadow-lg border border-white/20
                            ${liked
                                ? 'bg-red-500/80 text-white border-red-400/30'
                                : 'bg-white/40 text-white hover:bg-white/60'}`}
                    >
                        <Heart className={`w-4 h-4 transition-transform duration-300 ${liked ? 'fill-white scale-125' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
 
                    {/* Save + Share */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleSave}
                            title={saved ? 'Remove from saved' : 'Save to board'}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center
                                backdrop-blur-xl shadow-lg transition-all duration-300 active:scale-90 border border-white/20
                                ${saved ? 'bg-primary-500/80 text-white border-primary-400/30' : 'bg-white/40 text-white hover:bg-white/60'}`}
                        >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                        </button>
 
                        <div onClick={e => e.stopPropagation()}>
                            <Popover 
                                isOpen={shareOpen} 
                                setIsOpen={handleShareOpen}
                                placement="bottom-end"
                            >
                                <Popover.Trigger>
                                    <button
                                        title="Share"
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center
                                            backdrop-blur-xl shadow-lg transition-all duration-300 active:scale-90 border border-white/20
                                            ${shareOpen ? 'bg-primary-600/80 text-white' : 'bg-white/40 text-white hover:bg-white/60'}`}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </Popover.Trigger>
                                <Popover.Content className="z-[9999] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-700 py-2 w-48 p-0 overflow-hidden">
                                    <button
                                        onClick={handleCopyLink}
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/60 transition-colors font-medium border-none bg-transparent"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy link'}
                                    </button>
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=${safeEncode(postTitle)}&url=${safeEncode(postUrl)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/60 transition-colors font-medium"
                                    >
                                        <Twitter className="w-4 h-4 text-sky-500" /> Share on X
                                    </a>
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${safeEncode(postUrl)}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/60 transition-colors font-medium"
                                    >
                                        <Facebook className="w-4 h-4 text-blue-600" /> Share on Facebook
                                    </a>
                                    {typeof navigator !== 'undefined' && navigator.share && (
                                        <button
                                            onClick={() => {
                                                navigator.share({ title: postTitle, url: postUrl });
                                                closeShare();
                                            }}
                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700/60 transition-colors font-medium border-none bg-transparent"
                                        >
                                            <Share2 className="w-4 h-4" /> More options
                                        </button>
                                    )}
                                </Popover.Content>
                            </Popover>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Card Body (below media) ──────────────────────────────── */ }
            <div className="px-3.5 pt-3 pb-3.5 space-y-2">
                {/* Caption */}
                {hasImage && post.content && (
                    <p className="text-[13px] font-semibold text-secondary-800 dark:text-secondary-200 leading-snug line-clamp-2 tracking-tight">
                        {post.content}
                    </p>
                )}

                {/* User row */}
                <div className="flex items-center gap-2">
                    <Link
                        href={`/profile/${post.user.username}`}
                        onClick={e => { e.stopPropagation(); requireAuth(() => { }); }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 group/user"
                    >
                        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-secondary-100 dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700">
                            {post.user.avatar ? (
                                <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover transition-transform group-hover/user:scale-110" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-[11px] font-black text-secondary-400 uppercase">
                                    {post.user.name?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <p className="text-[12px] font-black text-secondary-900 dark:text-white truncate group-hover/user:text-primary-600 transition-colors uppercase tracking-tight">
                                    {post.user.name}
                                </p>
                                {post.user.verificationStatus === 'VERIFIED' && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                )}
                            </div>
                            <p className="text-[10px] text-secondary-400 dark:text-secondary-500 truncate leading-none font-bold uppercase tracking-wider">
                                {post.user.industry || 'Creator'}
                            </p>
                        </div>
                    </Link>

                    {/* Comment count */}
                    <button
                        onClick={e => { e.stopPropagation(); requireAuth(() => openPost(post.id, post)); }}
                        className="flex items-center gap-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors shrink-0"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {commentCount > 0 && <span className="text-[10.5px] font-medium">{commentCount}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
