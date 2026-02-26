'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, BadgeCheck, ExternalLink } from 'lucide-react';
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

    const requireAuth = (cb: () => void) => {
        if (!user) {
            openLogin();
            return;
        }
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
                // revert on error
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

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        requireAuth(() => {
            if (navigator.share) {
                navigator.share({ title: post.content?.slice(0, 60), url: `${window.location.origin}/posts/${post.id}` });
            }
        });
    };

    const handleCardClick = () => {
        openPost(post.id, post);
    };

    const hasImage = post.images && post.images.length > 0;
    const isTextPost = post.type === 'TEXT' || !hasImage;

    // Generate a gradient for text posts
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
            className="pin-card group relative rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 cursor-pointer shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-0.5 will-change-transform"
            onClick={handleCardClick}
        >
            {/* Image or Text Banner */}
            <div className="relative overflow-hidden">
                {hasImage ? (
                    <div className="relative">
                        <img
                            src={post.images[0]}
                            alt={post.content?.slice(0, 80) || 'Post image'}
                            className="w-full h-auto object-cover block transition-transform duration-500 group-hover:scale-[1.03]"
                            loading="lazy"
                        />

                        {/* Multiple images indicator */}
                        {post.images.length > 1 && (
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                <span>+{post.images.length - 1}</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`w-full min-h-[160px] bg-gradient-to-br ${gradient} p-5 flex items-start`}>
                        <p className="text-white text-base font-semibold leading-snug line-clamp-6">
                            {post.content}
                        </p>
                    </div>
                )}

                {/* Hover overlay — Pinterest style */}
                <div className="pin-card-overlay absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                {/* Save button top-right — appears on hover */}
                <div className="pin-card-overlay absolute top-2.5 right-2.5">
                    <button
                        onClick={handleSave}
                        className={`p-2.5 rounded-full font-semibold text-sm transition-all duration-200 active:scale-90 ${saved
                                ? 'bg-primary-600 text-white hover:bg-primary-700'
                                : 'bg-white text-secondary-800 hover:bg-secondary-100'
                            }`}
                    >
                        <Bookmark className={`w-4 h-4 ${saved ? 'fill-white' : ''}`} />
                    </button>
                </div>

                {/* Open detail button */}
                <div className="pin-card-overlay absolute top-2.5 left-2.5">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                        className="p-2 bg-white/90 rounded-full text-secondary-700 hover:bg-white transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Bottom overlay — Author + Like (Pinterest style) */}
                <div className="pin-card-overlay absolute bottom-0 left-0 right-0 flex items-end justify-between p-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden ring-1 ring-white/50 shrink-0">
                            {post.user.avatar ? (
                                <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-[10px] font-bold">
                                    {post.user.name?.charAt(0)?.toUpperCase()}
                                </span>
                            )}
                        </div>
                        <p className="text-white text-xs font-medium truncate max-w-[90px] drop-shadow">
                            {post.user.name}
                        </p>
                    </div>

                    {/* Like button on hover */}
                    <button
                        onClick={handleLike}
                        disabled={isLiking}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-full font-medium text-xs transition-all duration-200 active:scale-90 ${liked
                                ? 'bg-red-500 text-white'
                                : 'bg-white/90 text-secondary-700 hover:bg-white'
                            }`}
                    >
                        <Heart className={`w-3.5 h-3.5 transition-all ${liked ? 'fill-white scale-110' : ''}`} />
                        <span>{likeCount > 0 ? likeCount : ''}</span>
                    </button>
                </div>
            </div>

            {/* Card Body — only for image posts */}
            {hasImage && post.content && (
                <div className="px-3 py-2.5">
                    <p className="text-[13px] text-secondary-700 dark:text-secondary-300 leading-snug line-clamp-2">
                        {post.content}
                    </p>
                </div>
            )}

            {/* Footer — Category tag + actions */}
            <div className="px-3 pb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                    {post.category && (
                        <span className="text-[11px] font-medium text-secondary-500 dark:text-secondary-500 truncate">
                            {post.category.icon ? `${post.category.icon} ` : ''}{post.category.name}
                        </span>
                    )}
                    {post.user.verificationStatus === 'VERIFIED' && (
                        <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); requireAuth(() => openPost(post.id, post)); }}
                        className="flex items-center gap-1 text-secondary-400 hover:text-primary-500 transition-colors"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post._count?.postComments > 0 && (
                            <span className="text-[11px]">{post._count.postComments}</span>
                        )}
                    </button>
                    <button
                        onClick={handleShare}
                        className="text-secondary-400 hover:text-primary-500 transition-colors"
                    >
                        <Share2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
