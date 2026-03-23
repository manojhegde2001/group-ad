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

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
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
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useInfinitePosts({
        userId: profile?.id,
        visibility: 'PUBLIC',
        limit: '30',
    }, { enabled: !!profile?.id });

    const posts = useMemo(() => {
        return createdPostsData?.pages.flatMap((page: any) => page.posts) || [];
    }, [createdPostsData]);

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url).then(() => {
            toast.success('Profile link copied to clipboard!');
        }).catch(() => {
            toast.error('Failed to copy link');
        });
    };

    const handleReportUser = () => {
        const reason = window.prompt('Please enter a reason for reporting this user:');
        if (reason && profile) {
            reportMutation.mutate({
                targetType: 'USER',
                targetId: profile.id,
                reason,
            });
        }
    };

    const handleBlockUser = () => {
        if (profile && window.confirm(`Are you sure you want to block ${profile.name}? You will no longer see their posts or be able to message them.`)) {
            blockMutation.mutate(profile.id, {
                onSuccess: () => refetchProfile()
            });
        }
    };

    const handleUnblockUser = () => {
        if (profile) {
            unblockMutation.mutate(profile.id, {
                onSuccess: () => refetchProfile()
            });
        }
    };

    if (loadingProfile) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                <ImageOff className="w-20 h-20 text-secondary-200" />
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Profile not found</h1>
                <p className="text-secondary-500 max-w-md">The user @{username} might have changed their username or the profile doesn't exist.</p>
                <Button variant="solid" color="primary" rounded="pill" className="mt-4">
                    <Link href="/">Return to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-secondary-950">
            {/* Instagram Style Header - Highly Compact & Premium */}
            <div className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-14 mb-8">
                    {/* Large Avatar */}
                    <div className="relative shrink-0">
                        <div className="w-28 h-28 md:w-40 md:h-40 rounded-full p-1 border-2 border-primary-500/20 dark:border-primary-500/10 shadow-lg overflow-hidden bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center transition-all duration-500 hover:ring-4 ring-primary-500/10">
                            {profile.avatar ? (
                                <img 
                                    src={profile.avatar} 
                                    alt={profile.name} 
                                    className="w-full h-full rounded-full object-cover transition-transform duration-700 hover:scale-105"
                                />
                            ) : (
                                <span className="text-4xl md:text-6xl font-black text-secondary-300 dark:text-secondary-600 uppercase">
                                    {profile.name.charAt(0)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info & Stats Section */}
                    <div className="flex-1 flex flex-col items-center md:items-start space-y-6 w-full">
                        {/* Title Row */}
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl md:text-3xl font-black text-secondary-900 dark:text-white tracking-tight">
                                    {profile.username}
                                </h1>
                                {profile.verificationStatus === 'VERIFIED' && (
                                    <BadgeCheck className="w-6 h-6 text-primary-500 fill-primary-500/10" />
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap justify-center">
                                {isOwnProfile ? (
                                    <>
                                        <Button 
                                            variant="outline" 
                                            rounded="pill" 
                                            className="font-bold px-5 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                            onClick={() => router.push('/settings')}
                                        >
                                            Edit profile
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            rounded="pill" 
                                            className="font-bold px-4 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                            onClick={() => router.push('/boards/saved')}
                                        >
                                            Saved posts
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            rounded="pill" 
                                            className="font-bold px-4 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                            onClick={handleShare}
                                        >
                                            Share profile
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {profile.isBlocked ? (
                                            <Button 
                                                variant="solid" 
                                                rounded="pill" 
                                                className="font-bold px-5 h-9 text-xs bg-red-600 hover:bg-red-700 text-white"
                                                onClick={handleUnblockUser}
                                                isLoading={unblockMutation.isPending}
                                            >
                                                Unblock
                                            </Button>
                                        ) : (
                                            <>
                                                <FollowButton 
                                                    userId={profile.id} 
                                                    initialFollowing={profile.isFollowing ?? false}
                                                    initialFollowerCount={profile._count?.followers ?? 0}
                                                    size="sm"
                                                />
                                                <Button 
                                                    variant="outline" 
                                                    rounded="pill" 
                                                    className="font-bold px-5 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                                    onClick={() => router.push(`/messages?userId=${profile.id}`)}
                                                >
                                                    Message
                                                </Button>
                                            </>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            rounded="pill" 
                                            className="font-bold px-4 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                            onClick={handleShare}
                                        >
                                            <Share2 className="w-3.5 h-3.5" />
                                        </Button>

                                        {/* Moderation Meatball Menu */}
                                        <Popover 
                                            isOpen={isMenuOpen} 
                                            setIsOpen={setIsMenuOpen}
                                            placement="bottom-end"
                                        >
                                            <Popover.Trigger>
                                                <Button 
                                                    variant="outline" 
                                                    rounded="pill" 
                                                    className="font-bold px-3 h-9 text-xs border-secondary-300 dark:border-secondary-700 text-secondary-900 dark:text-secondary-100 hover:bg-secondary-100 dark:hover:bg-secondary-800/50 transition-colors"
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            </Popover.Trigger>
                                            <Popover.Content className="w-44 p-2 bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700">
                                                <div className="flex flex-col gap-1">
                                                    <button 
                                                        onClick={() => { handleReportUser(); setIsMenuOpen(false); }}
                                                        className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors cursor-pointer text-secondary-900 dark:text-white"
                                                    >
                                                        <Flag className="w-4 h-4" /> Report Profile
                                                    </button>
                                                    {!profile.isBlocked && (
                                                        <button 
                                                            onClick={() => { handleBlockUser(); setIsMenuOpen(false); }}
                                                            className="w-full flex items-center gap-2 text-sm font-bold py-2.5 px-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors cursor-pointer"
                                                        >
                                                            <Ban className="w-4 h-4" /> Block User
                                                        </button>
                                                    )}
                                                </div>
                                            </Popover.Content>
                                        </Popover>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-8 md:gap-12">
                            <div className="flex items-center md:flex-col items-start gap-1.5 md:gap-0">
                                <span className="text-secondary-900 dark:text-white font-black text-base md:text-lg">{profile._count?.posts ?? 0}</span>
                                <span className="text-secondary-400 dark:text-secondary-300 font-bold uppercase tracking-widest text-[10px] md:text-xs">posts</span>
                            </div>
                            <div className="flex items-center md:flex-col items-start gap-1.5 md:gap-0">
                                <span className="text-secondary-900 dark:text-white font-black text-base md:text-lg">{profile._count?.followers ?? 0}</span>
                                <span className="text-secondary-400 dark:text-secondary-300 font-bold uppercase tracking-widest text-[10px] md:text-xs">followers</span>
                            </div>
                            <div className="flex items-center md:flex-col items-start gap-1.5 md:gap-0">
                                <span className="text-secondary-900 dark:text-white font-black text-base md:text-lg">{profile._count?.following ?? 0}</span>
                                <span className="text-secondary-400 dark:text-secondary-300 font-bold uppercase tracking-widest text-[10px] md:text-xs">following</span>
                            </div>
                        </div>

                        {/* Bio & Details Row */}
                        <div className="space-y-1.5 text-center md:text-left">
                            <p className="font-black text-secondary-900 dark:text-white text-base tracking-tight">{profile.name}</p>
                            {profile.bio && (
                                <p className="text-secondary-600 dark:text-secondary-300 text-sm font-medium leading-relaxed max-w-md">
                                    {profile.bio}
                                </p>
                            )}
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mt-2">
                                {profile.userType === 'BUSINESS' && profile.phone && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-secondary-400 uppercase tracking-wider">
                                        <Phone className="w-3 h-3 text-primary-500" /> {profile.phone}
                                    </span>
                                )}
                                {profile.externalLink && (
                                    <a href={profile.externalLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-widest transition-colors">
                                        <LinkIcon className="w-3 h-3" /> Website
                                    </a>
                                )}
                                {(profile.address || profile.pincode) && (
                                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-secondary-400 uppercase tracking-wider">
                                        <MapPin className="w-3 h-3 text-emerald-500" /> 
                                        {[profile.address, profile.pincode].filter(Boolean).join(', ')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Divider */}
            <div className="border-t border-secondary-100 dark:border-secondary-800 max-w-5xl mx-auto mb-8">
                <div className="flex justify-center">
                    <div className="border-t-2 border-secondary-900 dark:border-white pt-3 -mt-[2px] px-8">
                        <span className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-secondary-900 dark:text-white">
                            <Plus className="w-3.5 h-3.5" />
                            Posts
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1800px] mx-auto px-4 py-8">
                {loadingCreated ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center gap-4 text-secondary-400">
                        <ImageOff className="w-16 h-16 stroke-[1.5px]" />
                        <p className="text-lg font-medium">No posts here yet</p>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointCols}
                        className="flex -ml-4 w-auto"
                        columnClassName="pl-4 bg-clip-padding"
                    >
                        {posts.map((post: PostWithRelations, i: number) => (
                            <div
                                key={post.id}
                                className="mb-4 animate-slide-up opacity-0"
                                style={{ animationDelay: `${Math.min(i * 40, 400)}ms`, animationFillMode: 'forwards' }}
                            >
                                <PostCard post={post} showActions={isOwnProfile} />
                            </div>
                        ))}
                    </Masonry>
                )}
            </div>
        </div>
    );
}
