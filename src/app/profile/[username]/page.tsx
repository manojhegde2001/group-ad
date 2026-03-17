'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { FollowButton } from '@/components/profile/follow-button';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import { Loader2, ImageOff, Link as LinkIcon, BadgeCheck, Share2 } from 'lucide-react';
import { useUserByUsername } from '@/hooks/use-api/use-user';
import { useInfinitePosts } from '@/hooks/use-api/use-posts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const breakpointCols = {
    default: 5, 1536: 4, 1280: 4, 1024: 3, 768: 2, 640: 2, 0: 1,
};

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();
    const [activeTab, setActiveTab] = useState<'created' | 'saved'>('created');

    const {
        data: profileData,
        isLoading: loadingProfile,
    } = useUserByUsername(username);

    const profile = profileData?.user;

    const {
        data: postsData,
        isLoading: loadingPosts,
    } = useInfinitePosts({
        userId: profile?.id,
        visibility: 'PUBLIC',
        limit: '30',
        // In a real app, 'saved' would hit a different endpoint or filter
    }, { enabled: !!profile?.id });

    const posts = postsData?.pages.flatMap((page: any) => page.posts) || [];

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
            {/* Header Section - Horizontal Layout like Instagram/Pinterest */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-16 pt-12 pb-16 px-4 max-w-5xl mx-auto">
                {/* Left Side: Large Avatar */}
                <div className="relative shrink-0">
                    <div className="w-40 h-40 md:w-52 md:h-52 rounded-full border-[6px] border-white dark:border-secondary-900 shadow-2xl overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center transition-transform hover:scale-105 duration-300">
                        {profile.avatar ? (
                            <img 
                                src={profile.avatar} 
                                alt={profile.name} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-5xl md:text-7xl font-bold text-primary-600 dark:text-primary-400 uppercase">
                                {profile.name.charAt(0)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Right Side: User Details */}
                <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                        <h1 className="text-3xl md:text-4xl font-black text-secondary-900 dark:text-white tracking-tight">
                            {profile.name}
                        </h1>
                        {profile.verificationStatus === 'VERIFIED' && (
                            <BadgeCheck className="w-7 h-7 text-primary-500 fill-primary-500/10 hidden md:block" />
                        )}
                        
                        <div className="flex items-center gap-2 md:ml-4">
                            <FollowButton 
                                userId={profile.id} 
                                initialFollowing={profile.isFollowing ?? false}
                                initialFollowerCount={profile._count?.followers ?? 0}
                                size="sm"
                            />
                            <Button variant="outline" rounded="pill" size="sm" className="font-bold px-4 border-secondary-200 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-50 h-9">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                            </Button>
                        </div>
                    </div>

                    <p className="text-secondary-500 font-bold text-lg mb-6">@{profile.username}</p>

                    <div className="flex items-center gap-6 mb-8 text-base font-bold text-secondary-800 dark:text-secondary-200">
                        <button className="hover:underline transition-all">
                            <span className="text-secondary-900 dark:text-white mr-1">{profile._count?.followers ?? 0}</span> 
                            followers
                        </button>
                        <span className="w-1.5 h-1.5 bg-secondary-300 rounded-full" />
                        <button className="hover:underline transition-all">
                            <span className="text-secondary-900 dark:text-white mr-1">{profile._count?.following ?? 0}</span> 
                            following
                        </button>
                    </div>

                    {profile.bio && (
                        <p className="text-secondary-600 dark:text-secondary-400 max-w-xl text-lg leading-relaxed font-medium">
                            {profile.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-t border-secondary-100 dark:border-secondary-800 sticky top-16 md:top-20 bg-white/80 dark:bg-secondary-950/80 backdrop-blur-md z-30">
                <div className="flex justify-center gap-8 py-4">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={cn(
                            "pb-2 text-sm font-bold transition-all relative",
                            activeTab === 'created' 
                                ? "text-secondary-900 dark:text-white" 
                                : "text-secondary-500 hover:text-secondary-700"
                        )}
                    >
                        Created
                        {activeTab === 'created' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-900 dark:bg-white rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={cn(
                            "pb-2 text-sm font-bold transition-all relative",
                            activeTab === 'saved' 
                                ? "text-secondary-900 dark:text-white" 
                                : "text-secondary-500 hover:text-secondary-700"
                        )}
                    >
                        Saved
                        {activeTab === 'saved' && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary-900 dark:bg-white rounded-full" />
                        )}
                    </button>
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
