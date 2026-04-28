'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    Heart, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video, MoreHorizontal, Edit2, Trash2, Flag,
    ExternalLink, User, X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { useSaveToBoard, useSharePost, useCreatePostModal, usePostDetail } from '@/hooks/use-feed';
import { useLikePost, useDeletePost } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { useReport, useBlock } from '@/hooks/use-api/use-moderation';
import { Drawer, Popover } from 'rizzui';
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
    const { openPost } = usePostDetail();
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
        e.preventDefault();
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
        e.preventDefault();
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
        e.preventDefault();
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
            className="group relative rounded-xl overflow-hidden bg-white dark:bg-secondary-900 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 block border border-secondary-100/50 dark:border-secondary-800/30"
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
                            <div className="absolute top-3 left-3 bg-white/95 dark:bg-secondary-900/95 backdrop-blur-md text-secondary-900 dark:text-white text-[10px] px-2.5 py-1 rounded-xl font-black border border-secondary-200/50 shadow-lg z-20">
                                +{post.images.length - 1}
                            </div>
                        )}
                    </div>
                ) : (
                        <div className={`w-full min-h-[170px] bg-gradient-to-br ${gradient} p-6 flex items-start transition-all duration-500 group-hover:brightness-105`}>
                            <p className="text-white text-[13px] md:text-[12px] font-bold md:font-semibold leading-relaxed line-clamp-6 tracking-tight drop-shadow-md">{post.content}</p>
                        </div>
                )}

                <AnimatePresence>
                    {showHeartPop && (
                        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                            <Heart className="w-24 h-24 text-white fill-white drop-shadow-2xl" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hover Overlays - Hidden on mobile */}
                <div 
                    className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 hidden md:flex flex-col justify-between p-4 pointer-events-none bg-black/10"
                    onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                >
                    <div className="flex items-start justify-between w-full pointer-events-auto">
                        <Popover placement="bottom-end">
                            <Popover.Trigger>
                                <button 
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all active:scale-90 shadow-xl"
                                >
                                    <MoreHorizontal className="w-5 h-5" />
                                </button>
                            </Popover.Trigger>
                            <Popover.Content className="!p-2 !rounded-[1.5rem] !bg-white/95 dark:!bg-secondary-900/95 !backdrop-blur-xl !border-secondary-100 dark:!border-secondary-800 !shadow-2xl !w-56 z-50">
                                <div className="flex flex-col gap-1">
                                    {user?.id === post.userId ? (
                                        <>
                                            <button 
                                                onClick={() => { openCreatePostModal(post); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all text-left"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-500" />
                                                <span className="text-[13px] font-bold text-secondary-900 dark:text-white">Edit Post</span>
                                            </button>
                                            <button 
                                                onClick={handleDeletePost}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left group/del"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                <span className="text-[13px] font-bold text-red-500">Delete Post</span>
                                            </button>
                                        </>
                                    ) : (
                                        <button 
                                            onClick={handleReport}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left"
                                        >
                                            <Flag className="w-4 h-4 text-red-500" />
                                            <span className="text-[13px] font-bold text-red-500">Report Post</span>
                                        </button>
                                    )}
                                    <div className="h-px bg-secondary-100 dark:bg-secondary-800 my-1 mx-2" />
                                    <button 
                                        onClick={() => openShare(post.id, 'feed')}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all text-left"
                                    >
                                        <Share2 className="w-4 h-4 text-secondary-500" />
                                        <span className="text-[13px] font-bold text-secondary-900 dark:text-white">Share</span>
                                    </button>
                                    <button 
                                        onClick={() => { router.push(`/posts/${post.id}`); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all text-left"
                                    >
                                        <ExternalLink className="w-4 h-4 text-secondary-500" />
                                        <span className="text-[13px] font-bold text-secondary-900 dark:text-white">Expand Visual</span>
                                    </button>
                                </div>
                            </Popover.Content>
                        </Popover>

                        <button 
                            onClick={handleSave} 
                            className={cn(
                                "h-11 px-5 rounded-full flex items-center justify-center backdrop-blur-md shadow-xl transition-all duration-300 font-bold text-xs",
                                saved ? 'bg-[#E60023] text-white scale-105' : 'bg-[#E60023] text-white hover:bg-[#ad081b] active:scale-95'
                            )}
                        >
                            {saved ? 'Saved' : 'Save'}
                        </button>
                    </div>
                    <div className="flex items-center justify-between w-full pointer-events-auto" onClick={e => { e.preventDefault(); e.stopPropagation(); }}>
                        <div className="flex items-center gap-2">
                             <button onClick={handleLike} className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300",
                                liked ? 'bg-white text-red-500' : 'bg-white/80 text-secondary-900 hover:bg-white'
                            )}>
                                <Heart className={cn("w-5 h-5", liked && "fill-current")} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {post.content && (
                <div className="px-2 md:px-4 py-2.5 md:py-3 flex items-start justify-between gap-1">
                    <p className="text-[11px] md:text-[12px] font-bold md:font-semibold text-secondary-900 dark:text-secondary-100 leading-tight line-clamp-2 tracking-tight flex-1">
                        {post.content}
                    </p>
                    <div className="md:hidden shrink-0 pt-0.5">
                        <button 
                            onClick={e => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(true); }}
                            className="p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 active:scale-90 transition-all"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>

                        <Drawer
                            isOpen={isMenuOpen}
                            onClose={() => setIsMenuOpen(false)}
                            placement="bottom"
                            containerClassName="w-full h-auto max-h-[92vh] bg-white dark:bg-secondary-900 rounded-t-[2.5rem] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 pb-10 flex flex-col gap-4 overflow-y-auto relative">
                                <div className="w-12 h-1.5 bg-secondary-200 dark:bg-secondary-800 rounded-full mx-auto mb-2 shrink-0" />
                                
                                {/* Close Button Top Right */}
                                <button 
                                    onClick={() => setIsMenuOpen(false)}
                                    className="absolute top-5 right-5 p-2 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-500 active:scale-90 transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] px-2">Post Options</p>
                                
                                <div className="grid grid-cols-1 gap-2">
                                    {/* View Post */}
                                    <button 
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); openPost(post.id, post); setIsMenuOpen(false); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-secondary-900 flex items-center justify-center shadow-sm">
                                            <ExternalLink className="w-4.5 h-4.5 text-primary-500" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-bold text-secondary-900 dark:text-white">View Full Post</span>
                                            <span className="text-[10px] text-secondary-500 uppercase font-bold tracking-wider">Open details</span>
                                        </div>
                                    </button>

                                    {/* Save Post */}
                                    <button 
                                        onClick={e => { e.preventDefault(); e.stopPropagation(); requireAuth(() => { openSaveToBoard(post.id); setIsMenuOpen(false); }); }}
                                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all active:scale-[0.98]"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white dark:bg-secondary-900 flex items-center justify-center shadow-sm">
                                            <Bookmark className={cn("w-4.5 h-4.5", (post as any).isBookmarked ? "text-primary-500 fill-primary-500" : "text-secondary-600")} />
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-bold text-secondary-900 dark:text-white">{(post as any).isBookmarked ? "Saved to Board" : "Save to Board"}</span>
                                            <span className="text-[10px] text-secondary-500 uppercase font-bold tracking-wider">Keep for later</span>
                                        </div>
                                    </button>

                                    {/* User Profile */}
                                    {post.user && (
                                        <button 
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/profile/${post.user.username}`); setIsMenuOpen(false); }}
                                            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all active:scale-[0.98]"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-white dark:bg-secondary-900 flex items-center justify-center shadow-sm">
                                                <User className="w-4.5 h-4.5 text-secondary-600" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-bold text-secondary-900 dark:text-white">{user?.id === post.userId ? "My Profile" : "Visit Profile"}</span>
                                                <span className="text-[10px] text-secondary-500 uppercase font-bold tracking-wider">@{post.user.username}</span>
                                            </div>
                                        </button>
                                    )}

                                    {/* Owner Controls (Edit/Delete) - Only for the post owner */}
                                    {user?.id === post.userId && (
                                        <div className="grid grid-cols-2 gap-2 mt-1">
                                            <button 
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); openCreatePostModal(post); setIsMenuOpen(false); }}
                                                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all active:scale-[0.98]"
                                            >
                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                                <span className="font-bold text-xs text-blue-600">Edit Post</span>
                                            </button>

                                            <button 
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleDeletePost(); setIsMenuOpen(false); }}
                                                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                                <span className="font-bold text-xs text-red-600">Delete</span>
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button 
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); openShare(post.id, 'feed'); setIsMenuOpen(false); }}
                                            className={cn(
                                                "flex items-center justify-center gap-2 p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-all active:scale-[0.98]",
                                                user?.id === post.userId ? "col-span-2" : "col-span-1"
                                            )}
                                        >
                                            <Share2 className="w-4 h-4 text-secondary-600" />
                                            <span className="font-bold text-xs text-secondary-900 dark:text-white">Share Post</span>
                                        </button>

                                        {user?.id !== post.userId && (
                                            <button 
                                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleReport(); setIsMenuOpen(false); }}
                                                className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50/50 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]"
                                            >
                                                <Flag className="w-4 h-4 text-red-500" />
                                                <span className="font-bold text-xs text-red-600">Report</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Drawer>
                    </div>
                </div>
            )}
        </Link>
    );
}
