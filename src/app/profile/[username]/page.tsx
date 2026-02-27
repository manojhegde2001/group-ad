'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { FollowButton } from '@/components/profile/follow-button';
import { UserStats } from '@/components/profile/user-stats';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import {
    MapPin, Globe, BadgeCheck, CalendarDays, Loader2, ImageOff,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const breakpointCols = {
    default: 4, 1280: 3, 1024: 3, 768: 2, 640: 2, 0: 1,
};

export default function PublicProfilePage() {
    const { username } = useParams<{ username: string }>();

    const [profile, setProfile] = useState<any>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [followerCount, setFollowerCount] = useState(0);

    useEffect(() => {
        if (!username) return;

        // Fetch user by username
        const fetchProfile = async () => {
            try {
                // We search by username via the users/by-username route
                const res = await fetch(`/api/users/by-username/${username}`);
                if (!res.ok) {
                    setLoadingProfile(false);
                    return;
                }
                const data = await res.json();
                setProfile(data.user);
                setFollowerCount(data.user._count?.followers ?? 0);
            } catch {
                // silent
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [username]);

    useEffect(() => {
        if (!profile?.id) return;

        const fetchPosts = async () => {
            try {
                const res = await fetch(`/api/posts?userId=${profile.id}&visibility=PUBLIC&limit=30`);
                if (!res.ok) return;
                const data = await res.json();
                setPosts(data.posts ?? []);
            } catch {
                // silent
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [profile?.id]);

    if (loadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
                <ImageOff className="w-16 h-16 text-secondary-300" />
                <h1 className="text-2xl font-bold text-secondary-800 dark:text-white">User not found</h1>
                <p className="text-secondary-500">The profile @{username} doesn't exist.</p>
                <Link href="/" className="text-primary-600 hover:underline text-sm mt-2">← Back to feed</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
            {/* Cover / Header area */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 h-40 sm:h-52 w-full relative" />

            <div className="max-w-screen-xl mx-auto px-4">
                {/* Profile card */}
                <div className="relative -mt-16 bg-white dark:bg-secondary-900 rounded-2xl shadow-lg border border-secondary-100 dark:border-secondary-800 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                        {/* Avatar */}
                        <div className="-mt-16 sm:-mt-20 flex-shrink-0">
                            <Avatar
                                src={profile.avatar ?? undefined}
                                name={profile.name}
                                size="xl"
                                rounded="full"
                                className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white dark:ring-secondary-900 shadow-lg"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div>
                                    <div className="flex items-center justify-center sm:justify-start gap-1.5">
                                        <h1 className="text-xl sm:text-2xl font-bold text-secondary-900 dark:text-white">
                                            {profile.name}
                                        </h1>
                                        {profile.verificationStatus === 'VERIFIED' && (
                                            <BadgeCheck className="w-5 h-5 text-primary-500 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-secondary-500 text-sm">@{profile.username}</p>
                                </div>

                                <FollowButton
                                    userId={profile.id}
                                    initialFollowing={profile.isFollowing ?? false}
                                    initialFollowerCount={followerCount}
                                    onFollowChange={(_, count) => setFollowerCount(count)}
                                />
                            </div>

                            {profile.bio && (
                                <p className="mt-3 text-sm text-secondary-700 dark:text-secondary-300 max-w-lg">
                                    {profile.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-xs text-secondary-500">
                                {profile.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" /> {profile.location}
                                    </span>
                                )}
                                {profile.website && (
                                    <a
                                        href={profile.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary-600 hover:underline"
                                    >
                                        <Globe className="w-3.5 h-3.5" /> {profile.website.replace(/^https?:\/\//, '')}
                                    </a>
                                )}
                                {profile.createdAt && (
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="w-3.5 h-3.5" />
                                        Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                                    </span>
                                )}
                            </div>

                            <div className="mt-4">
                                <UserStats
                                    postCount={profile._count?.posts ?? 0}
                                    followerCount={followerCount}
                                    followingCount={profile._count?.following ?? 0}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Posts grid */}
                <h2 className="text-lg font-semibold text-secondary-800 dark:text-white mb-4">Posts</h2>

                {loadingPosts ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <ImageOff className="w-12 h-12 text-secondary-300" />
                        <p className="text-secondary-500">No public posts yet.</p>
                    </div>
                ) : (
                    <Masonry
                        breakpointCols={breakpointCols}
                        className="flex -ml-3 w-auto pb-10"
                        columnClassName="pl-3 bg-clip-padding"
                    >
                        {posts.map((post, i) => (
                            <div
                                key={post.id}
                                className="mb-3 animate-slide-up opacity-0"
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
