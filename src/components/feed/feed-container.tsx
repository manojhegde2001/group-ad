'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Masonry from 'react-masonry-css';
import { PostCard } from './post-card';
import { CategoryBar } from './category-bar';
import { useFeedFilter, useCreatePostModal } from '@/hooks/use-feed';
import { useInfinitePosts } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { Loader2, ImageOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

// Demo posts used as fallback when DB is empty  
const DEMO_POSTS: any[] = [
];

const breakpointCols = {
  default: 5,
  1920: 5,
  1536: 4,
  1280: 3,
  1024: 3,
  768: 2,
  480: 2,
};

interface FeedContainerProps {
  categoryId?: string | null;
  boardId?: string | null;
}

export function FeedContainer({ categoryId: initialCategoryId, boardId }: FeedContainerProps) {
  const { selectedCategoryId, searchQuery } = useFeedFilter();
  const effectiveCategoryId = initialCategoryId !== undefined ? initialCategoryId : selectedCategoryId;
  const { setOnCreated, setOnDeleted } = useCreatePostModal();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfinitePosts({
    categoryId: effectiveCategoryId,
    boardId,
    search: searchQuery,
    visibility: 'PUBLIC',
    limit: '20',
  });

  const posts = data?.pages.flatMap((page: any) => page.posts) || [];
  const isEmpty = !isLoading && posts.length === 0;
  const useDemoData = isEmpty && !searchQuery && !selectedCategoryId;

  const displayPosts = useDemoData ? DEMO_POSTS : posts;

  // Prepend new posts and handle deletions
  // In a real app we'd mutate the cache, but following the existing pattern:
  const [localPosts, setLocalPosts] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    setOnCreated((post: PostWithRelations) => {
      setLocalPosts(prev => {
        const index = prev.findIndex(p => p.id === post.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = post;
          return updated;
        }
        return [post, ...prev];
      });
    });

    // Handle deletion
    setOnDeleted((postId: string) => {
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
    });
  }, [setOnCreated, setOnDeleted]);

  const allPosts = [
    ...localPosts,
    ...displayPosts.filter((p: any) => !localPosts.find(lp => lp.id === p.id))
  ];

  // Infinite scroll
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton
                className={`w-full rounded-2xl ${i % 3 === 0 ? 'h-80' : i % 3 === 1 ? 'h-48' : 'h-64'}`}
              />
              <div className="flex items-center gap-2 px-1">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                  <Skeleton className="h-2 w-1/2 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <ImageOff className="w-16 h-16 text-secondary-300 mb-4" />
        <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">No posts found</h3>
        <p className="text-secondary-500 max-w-sm">
          {searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : 'No posts in this category yet. Be the first to post!'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-10 py-2 md:py-6">
      {/* Visually hidden H1 for SEO stability across auth states */}
      <h1 className="sr-only">Group Ad — Discover Professional Ideas & Business Networking Feed</h1>

      {useDemoData && (
        <p className="text-center text-xs text-secondary-400 mb-4">
          Showing sample posts — create posts to see real content
        </p>
      )}

      <Masonry
        breakpointCols={breakpointCols}
        className="flex -ml-2 sm:-ml-3 md:-ml-3 w-auto"
        columnClassName="pl-2 sm:pl-3 md:pl-3 bg-clip-padding"
      >
        {allPosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: Math.min(i * 0.05, 0.5),
              ease: [0.21, 1.11, 0.81, 0.99] // subtle spring effect
            }}
            className="mb-2 sm:mb-3 md:mb-3"
          >
            <PostCard post={post} priority={i < 4} />
          </motion.div>
        ))}
      </Masonry>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && !useDemoData && (
        <p className="text-center text-sm text-secondary-400 py-8">
          You've seen all posts ✨
        </p>
      )}
    </div>
  );
}
