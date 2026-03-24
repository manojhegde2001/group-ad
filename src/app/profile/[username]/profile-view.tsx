'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { FollowButton } from '@/components/profile/follow-button';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import { Loader2, ImageOff, Link as LinkIcon, BadgeCheck, Share2, Plus, Settings, Phone, MapPin, MoreHorizontal, Flag, Ban } from 'lucide-react';
import { useUserByUsername, useMe } from '@/hooks/use-api/use-user';
import { useInfinitePosts, useSavedPosts } from '@/hooks/use-api/use-posts';
import { useCreatePost } from '@/hooks/use-feed';
import { useReport, useBlock, useUnblock } from '@/hooks/use-api/use-moderation';
import { Button } from '@/components/ui/button';
import { Popover } from 'rizzui';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import type { PostWithRelations } from '@/types';

const breakpointCols = {
    default: 5, 1536: 4, 1280: 4, 1024: 3, 768: 2, 640: 2, 0: 1,
};

export default function ProfileView({ username }: { username: string }) {
    const router = useRouter();
    const { data: me } = useMe();
    const isOwnProfile = me?.username === username;

    const {
        data: profileData,
        isLoading: loadingProfile,
        refetch: refetchProfile
    } = useUserByUsername(username);

    const reportMutation = useReport();
    const blockMutation = useBlock();
    const unblockMutation = useUnblock();

    const profile = profileData?.user;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Refresh logic when a post is created
    const { setOnCreated } = useCreatePost();
    useEffect(() => {
        setOnCreated((newPost) => {
            // Refetch posts if we are on the profile
            refetchCreated();
        });
    }, [setOnCreated]);

    const {
        data: createdPostsData,
        fetchNextPage: fetchNextCreated,
        hasNextPage: hasNextCreated,
        isFetchingNextPage: isFetchingMoreCreated,
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useInfinitePosts({ 
        username,
        type: 'CREATED'
    });

    const {
        data: savedPostsData,
        fetchNextPage: fetchNextSaved,
        hasNextPage: hasNextSaved,
        isFetchingNextPage: isFetchingMoreSaved,
        isLoading: loadingSaved
    } = useSavedPosts({ 
        enabled: isOwnProfile 
    });

    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');

    const createdPosts = useMemo(() => 
        createdPostsData?.pages.flatMap((page: any) => page.posts) || [], 
    [createdPostsData]);

    const savedPosts = useMemo(() => 
        savedPostsData?.pages.flatMap((page: any) => page.posts) || [], 
    [savedPostsData]);

    const handleShareProfile = () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({
                title: `${profile?.name}'s Profile | Group Ad`,
                text: `Check out ${profile?.name}'s profile on Group Ad`,
                url: window.location.href
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Profile link copied!');
        }
    };

    const handleReport = () => {
        if (!me) { toast.error('Please login to report'); return; }
        const reason = window.prompt('Reason for reporting this user:');
        if (reason && profile) {
            reportMutation.mutate({ targetType: 'USER', targetId: profile.id, reason });
        }
    };

    const handleBlock = () => {
        if (!me) { toast.error('Please login to block'); return; }
        if (profile && window.confirm(`Are you sure you want to block ${profile.name}?`)) {
            blockMutation.mutate(profile.id);
        }
    };

    if (loadingProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500 mb-4" />
                <p className="text-secondary-500 font-medium animate-pulse">Loading experience...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
                <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                    <ImageOff className="w-10 h-10 text-secondary-400" />
                </div>
                <h2 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">Profile Not Found</h2>
                <p className="text-secondary-500 max-w-xs mb-8">The user you're looking for doesn't exist or has set their profile to private.</p>
                <Link href="/">
                    <Button rounded="pill" className="px-8 font-black uppercase tracking-widest text-xs h-12 shadow-xl shadow-primary-500/20">Return Home</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* --- Profile Header --- */}
            <div className="relative mb-12">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
                    {/* Avatar with Ring */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary-500 to-violet-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-[2.2rem] overflow-hidden border-4 border-white dark:border-secondary-900 shadow-2xl bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center">
                            {profile.avatar ? (
                                <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl font-black text-secondary-400 uppercase">{profile.name.charAt(0)}</span>
                            )}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left pt-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                            <h1 className="text-3xl md:text-4xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter flex items-center justify-center md:justify-start gap-2">
                                {profile.name}
                                {profile.verificationStatus === 'VERIFIED' && <BadgeCheck className="w-8 h-8 text-primary-500" />}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                {isOwnProfile ? (
                                    <Link href="/settings">
                                        <Button variant="outline" rounded="pill" className="h-10 px-6 font-black uppercase tracking-widest text-[10px] border-2">Edit Profile</Button>
                                    </Link>
                                ) : (
                                    <FollowButton 
                                        userId={profile.id} 
                                        initialFollowing={profile.isFollowing} 
                                        initialFollowerCount={profile._count?.followers || 0} 
                                    />
                                )}
                                <div className="flex items-center gap-2">
                                    <ActionIcon variant="outline" rounded="full" onClick={handleShareProfile} className="h-10 w-10 border-2">
                                        <Share2 className="w-4 h-4" />
                                    </ActionIcon>
                                    {!isOwnProfile && (
                                        <Popover 
                                            isOpen={isMenuOpen} 
                                            setIsOpen={setIsMenuOpen}
                                            placement="bottom-end"
                                        >
                                            <Popover.Trigger>
                                                <ActionIcon variant="outline" rounded="full" className="h-10 w-10 border-2">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </ActionIcon>
                                            </Popover.Trigger>
                                            <Popover.Content className="w-44 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700">
                                                <div className="flex flex-col gap-1">
                                                    <button 
                                                        onClick={handleReport}
                                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors text-secondary-900 dark:text-white"
                                                    >
                                                        <Flag className="w-4 h-4" /> Report
                                                    </button>
                                                    <button 
                                                        onClick={handleBlock}
                                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
                                                    >
                                                        <Ban className="w-4 h-4" /> Block
                                                    </button>
                                                </div>
                                            </Popover.Content>
                                        </Popover>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center justify-center md:justify-start gap-8 mb-8">
                            <div className="text-center md:text-left transition-transform hover:scale-105">
                                <p className="text-2xl font-black text-secondary-900 dark:text-white leading-none">{profile._count?.posts || 0}</p>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Posts</p>
                            </div>
                            <div className="text-center md:text-left transition-transform hover:scale-105">
                                <p className="text-2xl font-black text-secondary-900 dark:text-white leading-none">{profile._count?.followers || 0}</p>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Followers</p>
                            </div>
                            <div className="text-center md:text-left transition-transform hover:scale-105">
                                <p className="text-2xl font-black text-secondary-900 dark:text-white leading-none">{profile._count?.following || 0}</p>
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Following</p>
                            </div>
                        </div>

                        {/* Bio & Links */}
                        <div className="max-w-2xl space-y-4">
                            {profile.bio && <p className="text-secondary-700 dark:text-secondary-300 font-medium leading-relaxed">{profile.bio}</p>}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-bold">
                                {profile.location && (
                                    <div className="flex items-center gap-1.5 text-secondary-500">
                                        <MapPin className="w-4 h-4" /> {profile.location}
                                    </div>
                                )}
                                {profile.website && (
                                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary-500 hover:underline">
                                        <LinkIcon className="w-4 h-4" /> {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Tabs --- */}
            <div className="border-t border-secondary-100 dark:border-secondary-800">
                <div className="flex justify-center -mt-px gap-12 sm:gap-16">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={cn(
                            "py-4 flex items-center gap-2 border-t-2 transition-all group",
                            activeTab === 'created'
                                ? "border-secondary-900 dark:border-white text-secondary-900 dark:text-white"
                                : "border-transparent text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                        )}
                    >
                        <Plus className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'created' ? "fill-current" : "")} />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Created</span>
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={cn(
                                "py-4 flex items-center gap-2 border-t-2 transition-all group",
                                activeTab === 'saved'
                                    ? "border-secondary-900 dark:border-white text-secondary-900 dark:text-white"
                                    : "border-transparent text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
                            )}
                        >
                            <Settings className={cn("w-4 h-4 transition-transform group-hover:scale-110", activeTab === 'saved' ? "fill-current" : "")} />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Saved</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- Grid Content --- */}
            <div className="mt-8">
                {activeTab === 'created' ? (
                    loadingCreated ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary-100 dark:bg-secondary-800 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : createdPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                                <ImageOff className="w-8 h-8 text-secondary-300" />
                            </div>
                            <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">No Posts Yet</h3>
                            <p className="text-sm text-secondary-500 max-w-[240px]">Share your first enterprise professional update today.</p>
                        </div>
                    ) : (
                        <Masonry
                            breakpointCols={breakpointCols}
                            className="flex -ml-4 w-auto"
                            columnClassName="pl-4 bg-clip-padding"
                        >
                            {createdPosts.map((post: PostWithRelations) => (
                                <div key={post.id} className="mb-4">
                                    <PostCard post={post} />
                                </div>
                            ))}
                        </Masonry>
                    )
                ) : (
                    loadingSaved ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => <div key={i} className="aspect-[4/5] bg-secondary-100 dark:bg-secondary-800 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : savedPosts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-16 h-16 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                                <Settings className="w-8 h-8 text-secondary-300" />
                            </div>
                            <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">No Saved Posts</h3>
                            <p className="text-sm text-secondary-500 max-w-[240px]">Posts you save will appear here for quick access.</p>
                        </div>
                    ) : (
                        <Masonry
                            breakpointCols={breakpointCols}
                            className="flex -ml-4 w-auto"
                            columnClassName="pl-4 bg-clip-padding"
                        >
                            {savedPosts.map((post: PostWithRelations) => (
                                <div key={post.id} className="mb-4">
                                    <PostCard post={post} />
                                </div>
                            ))}
                        </Masonry>
                    )
                )}

                {/* Load More Trigger */}
                {activeTab === 'created' && hasNextCreated && (
                    <div className="flex justify-center mt-12 mb-8">
                        <Button
                            variant="outline"
                            rounded="pill"
                            isLoading={isFetchingMoreCreated}
                            onClick={() => fetchNextCreated()}
                            className="px-8 font-black uppercase tracking-widest text-[10px] h-11"
                        >
                            Load More Updates
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionIcon({ children, className, ...props }: any) {
    return (
        <button
            className={cn(
                "flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
