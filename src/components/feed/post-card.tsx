'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    Heart, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2, Flag
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useSaveToBoard, useSharePost, useCreatePostModal } from '@/hooks/use-feed';
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
    priority?: boolean;
}

export function PostCard({ post, onLikeChange, showActions = false, priority = false }: PostCardProps) {
    const [mounted, setMounted] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    useEffect(() => setMounted(true), []);
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const { open: openSaveToBoard } = useSaveToBoard();
    const { open: openCreatePostModal } = useCreatePostModal();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const likeMutation = useLikePost();
    const deletePostMutation = useDeletePost();
    const reportMutation = useReport();
    const blockMutation = useBlock();
    const router = useRouter();

    const [liked, setLiked] = useState<boolean>((post as any).isLikedByUser ?? false);
    const [likeCount, setLikeCount] = useState<number>(post._count?.postLikes ?? (post as any).likes ?? 0);
    const [showHeartPop, setShowHeartPop] = useState(false);

    useEffect(() => {
        setLiked((post as any).isLikedByUser ?? false);
        setLikeCount(post._count?.postLikes ?? (post as any).likes ?? 0);
    }, [(post as any).isLikedByUser, post._count?.postLikes]);

    const saved = (post as any).isBookmarked ?? false;
    const [copied, setCopied] = useState(false);

    const requireAuth = (cb: () => void) => { if (!user) { openLogin(); return; } cb(); };

    const handleLike = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => {
            if (likeMutation.isPending) return;
            const newLiked = !liked;
            setLiked(newLiked);
            setLikeCount(c => newLiked ? c + 1 : Math.max(0, c - 1));
            onLikeChange?.(post.id, newLiked);
            likeMutation.mutate({ postId: post.id, liked: newLiked }, {
                onError: () => {
                    setLiked(!newLiked);
                    setLikeCount(c => !newLiked ? c + 1 : Math.max(0, c - 1));
                },
            });
        });
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => openSaveToBoard(post.id));
    };

    const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/posts/${post.id}` : '';
    const postTitle = post.content ? post.content.slice(0, 60) : 'Check out this post';

    const safeEncode = (str: string) => {
        try { return encodeURIComponent(str.toWellFormed ? str.toWellFormed() : str.replace(/[\uD800-\uDFFF]/g, '')); }
        catch { return encodeURIComponent(str.replace(/[^\x00-\x7F]/g, '')); }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => { setCopied(false); closeShare(); }, 1500);
        } catch { }
    };

    const handleDoubleTap = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!liked) handleLike(e);
        setShowHeartPop(true);
        setTimeout(() => setShowHeartPop(false), 800);
    };

    // Removed handleCardClick to use <Link> component instead

    const handleReport = () => {
        requireAuth(() => {
            const reason = window.prompt('Please enter a reason for reporting this post:');
            if (reason) reportMutation.mutate({ targetType: 'POST', targetId: post.id, reason });
        });
    };

    const handleDeletePost = () => {
        requireAuth(() => {
            if (window.confirm('Are you sure you want to delete this post?')) deletePostMutation.mutate(post.id);
        });
    };

    const gradients = [
        'from-violet-500 to-indigo-600', 'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600', 'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    if (!mounted) return null;

    return (
        <Link 
            href={`/posts/${post.id}`}
            scroll={false}
            className="group relative rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-300 block"
        >
            <div className="relative overflow-hidden bg-secondary-50 dark:bg-secondary-800/30">
                {post.images && post.images.length > 0 ? (
                    <div className="relative overflow-hidden">
                        {(() => {
                            const src = post.images[0];
                            const isVideoItem = src.includes('/video/upload/') || src.match(/\.(mp4|mov|avi|webm|mkv)/i);
                            return isVideoItem ? (
                                <video
                                    src={src}
                                    className="w-full h-auto block"
                                    muted playsInline loop preload="metadata"
                                    onMouseEnter={e => e.currentTarget.play()}
                                    onMouseLeave={e => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                    onDoubleClick={handleDoubleTap}
                                />
                            ) : (
                                <img
                                    src={src}
                                    alt={post.content || ''}
                                    className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.03]"
                                    onDoubleClick={handleDoubleTap}
                                    loading="lazy"
                                />
                            );
                        })()}
                        {post.images.length > 1 && (
                            <div className="absolute top-3 left-3 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md text-secondary-900 dark:text-white text-[10.5px] px-2.5 py-1 rounded-xl font-black border border-secondary-200/50 shadow-lg z-20">
                                +{post.images.length - 1}
                            </div>
                        )}
                    </div>
                ) : (
                        <div className={`w-full min-h-[170px] bg-gradient-to-br ${gradient} p-6 flex items-start transition-all duration-500 group-hover:brightness-105`}>
                            <p className="text-white text-[14px] font-bold leading-relaxed line-clamp-6 tracking-tight drop-shadow-md">{post.content}</p>
                        </div>
                )}

                <AnimatePresence>
                    {showHeartPop && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hover Overlays */}
                <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3 pointer-events-none bg-black/20">
                    <div className="flex items-start justify-end gap-2 w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={handleSave} className={`w-9 h-9 rounded-xl flex items-center justify-center backdrop-blur-xl shadow-lg transition-all ${saved ? 'bg-[#E60023] text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                            <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-end justify-end w-full pointer-events-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={handleLike} className={`h-9 px-3.5 rounded-xl text-[11px] font-black uppercase tracking-wider backdrop-blur-xl shadow-lg border ${liked ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'}`}>
                            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-white' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            {post.content && (
                <div className="px-4 pt-3 pb-4">
                    <p className="text-[13px] font-semibold text-secondary-900 dark:text-secondary-100 leading-[1.4] line-clamp-2 tracking-tight">{post.content}</p>
                </div>
            )}
        </Link>
    );
}
