'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Heart, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2, Flag
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { usePostDetail, useSaveToBoard, useSharePost, useCreatePost } from '@/hooks/use-feed';
import { useLikePost, useDeletePost } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { useReport, useBlock } from '@/hooks/use-api/use-moderation';
import { Popover } from 'rizzui';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
    post: PostWithRelations;
    onLikeChange?: (postId: string, liked: boolean) => void;
    showActions?: boolean;
}

export function PostCard({ post, onLikeChange, showActions = false }: PostCardProps) {
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Added state
    useEffect(() => setMounted(true), []);
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const { openPost } = usePostDetail();
    const { open: openSaveToBoard } = useSaveToBoard();
    const { open: openCreatePost } = useCreatePost();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const likeMutation = useLikePost();
    const deletePostMutation = useDeletePost();
    const reportMutation = useReport();
    const blockMutation = useBlock();
    const router = useRouter(); // Added useRouter

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
    const [copied, setCopied] = useState(false);

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

    const handleReport = () => { // Modified to be called without event
        requireAuth(() => {
            const reason = window.prompt('Please enter a reason for reporting this post:');
            if (reason) {
                reportMutation.mutate({
                    targetType: 'POST',
                    targetId: post.id,
                    reason,
                });
            }
        });
    };

    const handleDeletePost = () => { // New function for delete
        requireAuth(() => {
            if (window.confirm('Are you sure you want to delete this post?')) {
                deletePostMutation.mutate(post.id);
            }
        });
    };

    const handleBlock = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => {
            if (window.confirm(`Are you sure you want to block ${post.user.name}? You will no longer see their posts or be able to message them.`)) {
                blockMutation.mutate(post.userId);
            }
        });
    };

    const hasImage = post.images && post.images.length > 0;
    const isVideoPost = post.type === 'VIDEO';

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
            <div className="relative overflow-hidden bg-secondary-50 dark:bg-secondary-800/30">
                {post.images && post.images.length > 0 ? (
                    <div className="relative group/media overflow-hidden">
                        {(() => {
                            const src = post.images[0];
                            const isVideoItem = src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i);
                            
                            return (
                                <div className="relative overflow-hidden">
                                    {isVideoItem ? (
                                        <div className="relative aspect-square sm:aspect-auto">
                                            <video
                                                src={src}
                                                className="w-full h-full object-cover block"
                                                muted playsInline loop preload="metadata"
                                                onMouseEnter={e => e.currentTarget.play()}
                                                onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                                onDoubleClick={handleDoubleTap}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="bg-black/20 backdrop-blur-[2px] p-2.5 rounded-full border border-white/20 opacity-0 group-hover/media:opacity-100 transition-opacity duration-300">
                                                    <Video className="w-5 h-5 text-white" />
                                                </div>
                                            </div>
                                            <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded-lg font-bold border border-white/10 uppercase tracking-widest z-10 shadow-sm">
                                                Video
                                            </div>
                                        </div>
                                    ) : (
                                        <img
                                            src={src}
                                            alt=""
                                            className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-[1.05]"
                                            loading="lazy"
                                            onDoubleClick={handleDoubleTap}
                                        />
                                    )}
                                    
                                    {/* Multi-image indicator in top-left corner */}
                                    {post.images.length > 1 && (
                                        <div className="absolute top-3 left-3 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md text-secondary-900 dark:text-white text-[10.5px] px-2.5 py-1 rounded-xl font-black border border-secondary-200/50 dark:border-white/10 shadow-lg z-20 flex items-center gap-1.5 scale-90 group-hover:scale-100 transition-transform duration-300">
                                            <span className="opacity-70">+{post.images.length - 1}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    /* Empty State / Text Only */
                    <div className={`w-full min-h-[170px] bg-gradient-to-br ${gradient} p-6 flex items-start transition-all duration-500 group-hover:brightness-105`}>
                        <p className="text-white text-[16px] font-bold leading-relaxed line-clamp-6 tracking-tight drop-shadow-md">
                            {post.content}
                        </p>
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


            {/* Hover vignette */ }
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* ── Hover Overlays ────────────────────────────────────── */}
            <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3 pointer-events-none">
                {/* Top Section */}
                <div className="flex items-start justify-end gap-2 w-full">
                    <div className="flex items-center gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <button
                            onClick={handleSave}
                            title={saved ? 'Remove from saved' : 'Save to board'}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center
                                backdrop-blur-xl shadow-lg transition-all duration-300 active:scale-90 border
                                ${saved ? 'bg-primary-500/90 text-white border-primary-400/30' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'}`}
                        >
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                        </button>

                        <Popover isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} placement="bottom-end">
                            <Popover.Trigger>
                                <button title="More actions" className="w-9 h-9 rounded-xl flex items-center justify-center bg-black/50 hover:bg-black/70 text-white backdrop-blur-xl border border-white/10 shadow-lg transition-all active:scale-90">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Content className="w-52 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 overflow-hidden">
                                <div className="flex flex-col gap-0.5">
                                    <div className="px-2 py-1.5 text-[11px] font-black uppercase tracking-wider text-secondary-400 dark:text-secondary-500 text-left">
                                        Share
                                    </div>
                                    <button onClick={handleCopyLink} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-secondary-700 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors text-left border-none bg-transparent">
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
                                        {copied ? 'Copied!' : 'Copy link'}
                                    </button>
                                    <a href={`https://twitter.com/intent/tweet?text=${safeEncode(postTitle)}&url=${safeEncode(postUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-secondary-700 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors">
                                        <Twitter className="w-4 h-4 text-sky-500" /> Share on X
                                    </a>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${safeEncode(postUrl)}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-secondary-700 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors">
                                        <Facebook className="w-4 h-4 text-blue-600" /> Share on Facebook
                                    </a>

                                    <div className="h-px bg-secondary-100 dark:bg-secondary-800 my-1.5 mx-2" />

                                    <div className="px-2 py-1.5 text-[11px] font-black uppercase tracking-wider text-secondary-400 dark:text-secondary-500 text-left">
                                        Post
                                    </div>
                                    {(user && (user.id === post.userId || (user as any).userType === 'ADMIN')) && (
                                        <>
                                            <button onClick={() => { openCreatePost(post); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-secondary-700 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors text-left border-none bg-transparent">
                                                <Edit2 className="w-4 h-4" /> Edit Post
                                            </button>
                                            <button onClick={() => { handleDeletePost(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left border-none bg-transparent">
                                                <Trash2 className="w-4 h-4" /> Delete Post
                                            </button>
                                        </>
                                    )}
                                    <button onClick={() => { handleReport(); setIsMenuOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-bold text-secondary-700 dark:text-white hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-xl transition-colors text-left border-none bg-transparent">
                                        <Flag className="w-4 h-4" /> Report
                                    </button>
                                </div>
                            </Popover.Content>
                        </Popover>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="flex items-end justify-between w-full">
                    <Link
                        href={`/profile/${post.user.username}`}
                        onClick={e => { e.stopPropagation(); requireAuth(() => { }); }}
                        className="flex items-center gap-2 min-w-0 pointer-events-auto group/user bg-black/30 hover:bg-black/50 backdrop-blur-md p-1.5 pr-3 rounded-xl border border-white/10 transition-all shadow-lg"
                    >
                        <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-white/20 shadow-sm bg-secondary-800">
                            {post.user.avatar ? (
                                <img src={post.user.avatar} alt={post.user.name ?? ''} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase">
                                    {post.user.name?.charAt(0)}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                            <p className="font-bold text-[12px] text-white truncate tracking-tight">{post.user.name}</p>
                            {post.user.verificationStatus === 'VERIFIED' && <BadgeCheck className="w-3 h-3 text-primary-400" />}
                        </div>
                    </Link>

                    <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className={`flex items-center gap-2 h-9 px-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider
                            transition-all duration-300 active:scale-90 backdrop-blur-xl shadow-lg border pointer-events-auto
                            ${liked ? 'bg-red-500/90 text-white border-red-400/30' : 'bg-black/50 text-white border-white/10 hover:bg-black/70'}`}
                    >
                        <Heart className={`w-3.5 h-3.5 transition-transform duration-300 ${liked ? 'fill-white scale-110' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
                </div>
            </div>

            {/* ── Card Body (Caption only) ───────────────────────── */}
            {post.content && (
                <div className="px-4 pt-3 pb-4">
                    <p className="text-[14px] font-bold text-secondary-900 dark:text-secondary-100 leading-[1.3] line-clamp-2 tracking-tight">
                        {post.content}
                    </p>
                </div>
            )}
        </div>
    );
}
