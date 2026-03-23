'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Bookmark, ImageOff } from 'lucide-react';
import { useSavedPosts } from '@/hooks/use-api/use-posts';
import { PostCard } from '@/components/feed/post-card';
import Masonry from 'react-masonry-css';
import type { PostWithRelations } from '@/types';

const breakpointCols = {
    default: 5, 1536: 4, 1280: 4, 1024: 3, 768: 2, 640: 2, 0: 1,
};

export default function SavedPostsPage() {
    const {
        data: savedPostsData,
        isLoading: loadingSaved,
    } = useSavedPosts({
        limit: '50'
    });

    const posts = savedPostsData?.posts || [];

    return (
        <div className="min-h-screen bg-white dark:bg-secondary-950 pt-20 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/boards"
                            className="p-2 -ml-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center">
                                <Bookmark className="w-6 h-6 text-primary-500 fill-primary-500/10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight">
                                    Saved Posts
                                </h1>
                                <p className="text-sm font-bold text-secondary-400 uppercase tracking-widest leading-none mt-1">
                                    {posts.length} items
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {loadingSaved ? (
                    <div className="flex justify-center py-24">
                        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center gap-6 border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-[3rem]">
                        <div className="w-24 h-24 bg-secondary-50 dark:bg-secondary-900/50 rounded-full flex items-center justify-center">
                            <Bookmark className="w-10 h-10 text-secondary-200" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white">No saved posts yet</h2>
                            <p className="text-secondary-500 dark:text-secondary-400 max-w-sm mt-2">
                                Posts you save will appear here. Start exploring to find inspiration!
                            </p>
                        </div>
                        <Link 
                            href="/" 
                            className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary-500/20 transition-all active:scale-95"
                        >
                            Explore Feed
                        </Link>
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
                                <PostCard post={post} showActions={false} />
                            </div>
                        ))}
                    </Masonry>
                )}
            </div>
        </div>
    );
}
