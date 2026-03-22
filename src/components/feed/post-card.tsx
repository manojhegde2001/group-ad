'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { usePostDetail, useSaveToBoard, useSharePost } from '@/hooks/use-feed';
import { useLikePost } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { cn } from '@/lib/utils';
import { Popover } from 'rizzui';

interface PostCardProps {
    post: PostWithRelations;
    onLikeChange?: (postId: string, liked: boolean) => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const { openPost } = usePostDetail();
    const { open: openSaveToBoard } = useSaveToBoard();
    const { activePostId, source, open: openShare, close: closeShare } = useSharePost();
    const likeMutation = useLikePost();

    // ── Local optimistic like state ──────────────────────────────────────────
    const [liked, setLiked] = useState<boolean>((post as any).isLikedByUser ?? false);
    const [likeCount, setLikeCount] = useState<number>(
        post._count?.postLikes ?? (post as any).likes ?? 0
    );

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
                                />
                                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1 font-medium z-10">
                                    <Video className="w-3 h-3" /> Video
                                </div>
                            </>
                        ) : (
                            <img
                                src={post.images[0]}
                                alt={post.content?.slice(0, 80) || 'Post image'}
                                className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
                                loading="lazy"
                            />
                        )}
                        {!isVideoPost && post.images.length > 1 && (
                            <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold z-10">
                                {post.images.length}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`w-full min-h-[150px] bg-gradient-to-br ${gradient} p-4 flex items-start`}>
                        <p className="text-white text-sm font-semibold leading-snug line-clamp-6">
                            {post.content}
                        </p>
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
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold
                            transition-all duration-200 active:scale-90 backdrop-blur-sm shadow-md
                            ${liked
                                ? 'bg-red-500 text-white'
                                : 'bg-white/95 text-secondary-800 hover:bg-white'}`}
                    >
                        <Heart className={`w-3.5 h-3.5 transition-transform ${liked ? 'fill-white scale-110' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                    </button>

                    {/* Save + Share */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleSave}
                            title={saved ? 'Remove from saved' : 'Save to board'}
                            className={`w-8 h-8 rounded-full flex items-center justify-center
                                backdrop-blur-sm shadow-md transition-all duration-200 active:scale-90
                                ${saved ? 'bg-primary-600 text-white' : 'bg-white/95 text-secondary-800 hover:bg-white'}`}
                        >
                            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} />
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
                                        className={`w-8 h-8 rounded-full flex items-center justify-center
                                            backdrop-blur-sm shadow-md transition-all duration-200 active:scale-90
                                            ${shareOpen ? 'bg-primary-600 text-white' : 'bg-white/95 text-secondary-800 hover:bg-white'}`}
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
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
            <div className="px-3 pt-2.5 pb-3 space-y-1.5">
                {/* Caption */}
                {hasImage && post.content && (
                    <p className="text-[12.5px] font-medium text-secondary-800 dark:text-secondary-200 leading-snug line-clamp-2">
                        {post.content}
                    </p>
                )}

                {/* User row */}
                <div className="flex items-center gap-2">
                    <Link
                        href={`/profile/${post.user.username}`}
                        onClick={e => { e.stopPropagation(); requireAuth(() => { }); }}
                        className="flex items-center gap-2 min-w-0 flex-1 group/user"
                    >
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-secondary-100 dark:bg-secondary-800">
                            {post.user.avatar ? (
                                <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-secondary-500">
                                    {post.user.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1">
                                <p className="text-[11.5px] font-bold text-secondary-900 dark:text-white truncate group-hover/user:text-primary-600 transition-colors">
                                    {post.user.name}
                                </p>
                                {post.user.verificationStatus === 'VERIFIED' && (
                                    <BadgeCheck className="w-3 h-3 text-primary-500 shrink-0" />
                                )}
                            </div>
                            {(post.user.industry || post.user.bio) && (
                                <p className="text-[10px] text-secondary-400 dark:text-secondary-500 truncate leading-none">
                                    {post.user.industry || post.user.bio}
                                </p>
                            )}
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
