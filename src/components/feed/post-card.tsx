'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Heart, MessageCircle, Share2, Bookmark, BadgeCheck,
    Link2, Twitter, Facebook, Check, Video,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthModal } from '@/hooks/use-modal';
import { usePostDetail } from '@/hooks/use-feed';
import type { PostWithRelations } from '@/types';

interface PostCardProps {
    post: PostWithRelations;
    onLikeChange?: (postId: string, liked: boolean) => void;
}

export function PostCard({ post, onLikeChange }: PostCardProps) {
    const { user } = useAuth();
    const { openLogin } = useAuthModal();
    const { openPost } = usePostDetail();
    const [liked, setLiked] = useState(false);
    const [saved, setSaved] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes || 0);
    const [isLiking, setIsLiking] = useState(false);
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

    const requireAuth = (cb: () => void) => {
        if (!user) { openLogin(); return; }
        cb();
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(async () => {
            if (isLiking) return;
            setIsLiking(true);
            const newLiked = !liked;
            setLiked(newLiked);
            setLikeCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
            onLikeChange?.(post.id, newLiked);
            try {
                await fetch(`/api/posts/${post.id}/like`, { method: newLiked ? 'POST' : 'DELETE' });
            } catch {
                setLiked(!newLiked);
                setLikeCount((c) => (!newLiked ? c + 1 : Math.max(0, c - 1)));
            } finally {
                setIsLiking(false);
            }
        });
    };

    const handleSave = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => setSaved((s) => !s));
    };

    const handleShareOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShareOpen((o) => !o);
    };

    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/posts/${post.id}`;
    const postTitle = post.content?.slice(0, 60) || 'Check out this post';

    const handleCopyLink = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(postUrl);
            setCopied(true);
            setTimeout(() => { setCopied(false); setShareOpen(false); }, 1500);
        } catch {
            // fallback
        }
    };

    const handleNativeShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (navigator.share) {
            navigator.share({ title: postTitle, url: postUrl });
            setShareOpen(false);
        }
    };

    const handleCardClick = () => openPost(post.id, post);

    const hasImage = post.images && post.images.length > 0;
    const isVideoPost = post.type === 'VIDEO';
    const isTextPost = !hasImage;

    const gradients = [
        'from-violet-500 to-indigo-600',
        'from-rose-400 to-pink-600',
        'from-amber-400 to-orange-500',
        'from-emerald-400 to-teal-600',
        'from-sky-400 to-blue-600',
        'from-fuchsia-500 to-purple-700',
    ];
    const gradient = gradients[parseInt(post.id.slice(-1), 16) % gradients.length];

    return (
        <div
            className="pin-card group relative rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.13)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-0.5 will-change-transform"
            onClick={handleCardClick}
        >
            {/* Image / Video / Text Banner */}
            <div className="relative overflow-hidden">
                {hasImage ? (
                    <div className="relative">
                        {isVideoPost ? (
                            <>
                                <video
                                    src={post.images[0]}
                                    className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
                                    muted
                                    playsInline
                                    loop
                                    preload="metadata"
                                    onMouseEnter={(e) => e.currentTarget.play()}
                                    onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                                />
                                {/* Video badge */}
                                <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
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
                            <div className="absolute top-2.5 left-2.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                                +{post.images.length - 1} more
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`w-full min-h-[160px] bg-gradient-to-br ${gradient} p-5 flex items-start`}>
                        <p className="text-white text-sm font-semibold leading-snug line-clamp-6">
                            {post.content}
                        </p>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="pin-card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent pointer-events-none" />

                {/* Save button — top-right on hover */}
                <div className="pin-card-overlay absolute top-2.5 right-2.5">
                    <button
                        onClick={handleSave}
                        title={saved ? 'Unsave' : 'Save'}
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold transition-all duration-200 active:scale-90 shadow-sm ${saved
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-white text-secondary-700 hover:bg-secondary-50'
                            }`}
                    >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                    </button>
                </div>

                {/* Author + Like row — bottom overlay on hover */}
                <div className="pin-card-overlay absolute bottom-0 left-0 right-0 flex items-end justify-between p-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden ring-1 ring-white/50 shrink-0">
                            {post.user.avatar ? (
                                <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-[10px] font-bold">
                                    {post.user.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <p className="text-white text-xs font-medium truncate max-w-[80px] drop-shadow-sm">
                            {post.user.name}
                        </p>
                    </div>

                    {/* Like pill */}
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full font-semibold text-xs transition-all duration-200 active:scale-90 ${liked
                            ? 'bg-red-500 text-white'
                            : 'bg-white/90 text-secondary-700 hover:bg-white'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 transition-all ${liked ? 'fill-white scale-110' : ''}`} />
                        {likeCount > 0 && <span>{likeCount}</span>}
                    </button>
                </div>
            </div>

            {/* Card body — caption below image */}
            {hasImage && post.content && (
                <div className="px-3 pt-2.5 pb-1">
                    <p className="text-[12.5px] text-secondary-700 dark:text-secondary-300 leading-snug line-clamp-2">
                        {post.content}
                    </p>
                </div>
            )}

            {/* Footer — category + actions + share */}
            <div className="px-3 pb-3 pt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                    {post.category && (
                        <span className="text-[11px] font-medium text-secondary-400 dark:text-secondary-500 truncate">
                            {post.category.icon ? `${post.category.icon} ` : ''}{post.category.name}
                        </span>
                    )}
                    {post.user.verificationStatus === 'VERIFIED' && (
                        <BadgeCheck className="w-3 h-3 text-primary-500 shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Comment */}
                    <button
                        onClick={(e) => { e.stopPropagation(); requireAuth(() => openPost(post.id, post)); }}
                        className="flex items-center gap-1 text-secondary-400 hover:text-primary-500 transition-colors"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {(post._count?.postComments || 0) > 0 && (
                            <span className="text-[11px]">{post._count.postComments}</span>
                        )}
                    </button>

                    {/* Share dropdown */}
                    <div className="relative" ref={shareRef} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={handleShareOpen}
                            className={`text-secondary-400 hover:text-primary-500 transition-colors ${shareOpen ? 'text-primary-500' : ''}`}
                            title="Share"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                        </button>

                        {shareOpen && (
                            <div className="absolute bottom-7 right-0 z-50 bg-white dark:bg-secondary-800 rounded-xl shadow-xl border border-secondary-100 dark:border-secondary-700 py-1.5 w-44 animate-scale-in">
                                {/* Copy link */}
                                <button
                                    onClick={handleCopyLink}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Link2 className="w-3.5 h-3.5" />}
                                    {copied ? 'Copied!' : 'Copy link'}
                                </button>

                                {/* Twitter / X */}
                                <a
                                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    <Twitter className="w-3.5 h-3.5 text-sky-500" />
                                    Share on X
                                </a>

                                {/* Facebook */}
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                >
                                    <Facebook className="w-3.5 h-3.5 text-blue-600" />
                                    Share on Facebook
                                </a>

                                {/* Native share (mobile) */}
                                {'share' in navigator && (
                                    <button
                                        onClick={handleNativeShare}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-secondary-700 dark:text-secondary-200 hover:bg-secondary-50 dark:hover:bg-secondary-700 transition-colors"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        More options
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
