'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { FollowButton } from '@/components/profile/follow-button';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import { Loader2, ImageOff, Link as LinkIcon, BadgeCheck, Share2, Plus, Settings } from 'lucide-react';
import { useUserByUsername, useMe } from '@/hooks/use-api/use-user';
import { useInfinitePosts, useSavedPosts } from '@/hooks/use-api/use-posts';
import { useCreatePost } from '@/hooks/use-feed';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breakpointCols = {
    default: 5, 1536: 4, 1280: 4, 1024: 3, 768: 2, 640: 2, 0: 1,
};

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');
    const { data: me } = useMe();
    const isOwnProfile = me?.username === username;

    const {
        data: profileData,
        isLoading: loadingProfile,
        refetch: refetchProfile
    } = useUserByUsername(username);

    const profile = profileData?.user;

    // Refresh logic when a post is created
    const { setOnCreated } = useCreatePost();
    useEffect(() => {
        setOnCreated((newPost) => {
            // Refetch posts if we are on the 'created' tab
            if (activeTab === 'created') {
                refetchCreated();
            }
        });
    }, [activeTab, setOnCreated]);

    const {
        data: createdPostsData,
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useInfinitePosts({
        userId: profile?.id,
        visibility: 'PUBLIC',
        limit: '30',
    }, { enabled: !!profile?.id });

    const {
        data: savedPostsData,
        isLoading: loadingSaved,
    } = useSavedPosts({
        limit: '30'
    });

    const posts = useMemo(() => {
        if (activeTab === 'saved') {
            return savedPostsData?.posts || [];
        }
        return createdPostsData?.pages.flatMap((page: any) => page.posts) || [];
    }, [activeTab, createdPostsData, savedPostsData]);

    const loadingPosts = activeTab === 'created' ? loadingCreated : loadingSaved;

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
            {/* Pinterest/Lummi Style Header - Centered & Premium */}
            <div className="pt-16 pb-8 px-4 max-w-4xl mx-auto flex flex-col items-center text-center">
                {/* Large Avatar with Hover Effect */}
                <div className="relative mb-6 group">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white dark:border-secondary-900 shadow-xl overflow-hidden bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center transition-all duration-500 group-hover:shadow-2xl">
                        {profile.avatar ? (
                            <img 
                                src={profile.avatar} 
                                alt={profile.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <span className="text-4xl md:text-6xl font-black text-secondary-300 dark:text-secondary-600 uppercase">
                                {profile.name.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>

                {/* User Info */}
                <div className="space-y-2 mb-8">
                    <div className="flex items-center justify-center gap-2">
                        <h1 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white tracking-tight">
                            {profile.name}
                        </h1>
                        {profile.verificationStatus === 'VERIFIED' && (
                            <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-primary-500 fill-primary-500/10" />
                        )}
                    </div>
                    <p className="text-secondary-500 font-bold text-lg">@{profile.username}</p>
                </div>

                {/* Stats & Actions */}
                <div className="flex flex-col items-center gap-6 w-full">
                    {profile.bio && (
                        <p className="text-secondary-600 dark:text-secondary-400 max-w-lg text-lg leading-relaxed font-medium mb-2">
                            {profile.bio}
                        </p>
                    )}

                    <div className="flex items-center gap-8 text-base font-bold text-secondary-800 dark:text-secondary-200">
                        <div className="flex flex-col items-center">
                            <span className="text-secondary-900 dark:text-white text-xl">{profile._count?.followers ?? 0}</span>
                            <span className="text-sm text-secondary-400 font-medium">followers</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-secondary-900 dark:text-white text-xl">{profile._count?.following ?? 0}</span>
                            <span className="text-sm text-secondary-400 font-medium">following</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isOwnProfile ? (
                            <>
                                <Button 
                                    variant="solid" 
                                    color="primary" 
                                    rounded="pill" 
                                    className="font-bold px-8 h-12 text-base shadow-lg shadow-primary-500/20"
                                    onClick={() => useCreatePost.getState().open()}
                                >
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create
                                </Button>
                                <Button 
                                    variant="outline" 
                                    rounded="pill" 
                                    className="font-bold px-6 h-12 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50"
                                    onClick={() => router.push('/settings')}
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <FollowButton 
                                    userId={profile.id} 
                                    initialFollowing={profile.isFollowing ?? false}
                                    initialFollowerCount={profile._count?.followers ?? 0}
                                    size="lg"
                                />
                                <Button variant="outline" rounded="pill" className="font-bold px-6 h-12 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50">
                                    <Share2 className="w-5 h-5 mr-2" />
                                    Share
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-t border-secondary-100 dark:border-secondary-800 sticky top-16 md:top-20 bg-white/90 dark:bg-secondary-950/90 backdrop-blur-md z-30">
                <div className="flex justify-center gap-10 py-5">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={cn(
                            "pb-2 text-base font-bold transition-all relative",
                            activeTab === 'created' 
                                ? "text-secondary-900 dark:text-white scale-110" 
                                : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                        )}
                    >
                        Created
                        {activeTab === 'created' && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-secondary-900 dark:bg-white rounded-full animate-in fade-in slide-in-from-bottom-1" />
                        )}
                    </button>
                    {isOwnProfile && (
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={cn(
                                "pb-2 text-base font-bold transition-all relative",
                                activeTab === 'saved' 
                                    ? "text-secondary-900 dark:text-white scale-110" 
                                    : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
                            )}
                        >
                            Saved
                            {activeTab === 'saved' && (
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-secondary-900 dark:bg-white rounded-full animate-in fade-in slide-in-from-bottom-1" />
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-[1800px] mx-auto px-4 py-8">
                {loadingPosts ? (
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
                        {posts.map((post, i) => (
                            <div
                                key={post.id}
                                className="mb-4 animate-slide-up opacity-0"
                                style={{ animationDelay: `${Math.min(i * 40, 400)}ms`, animationFillMode: 'forwards' }}
                            >
                                <PostCard post={post} />
                            </div>
                        ))}
                    </Masonry>
                )}
            </div>
        </div>
    );
}
