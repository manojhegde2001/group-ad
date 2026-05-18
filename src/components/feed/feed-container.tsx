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
import { cn } from '@/lib/utils';
import { TeammateSuggestions } from '@/components/widgets/TeammateSuggestions';
import { useAuth } from '@/hooks/use-auth';
import { LogoLoader } from '@/components/ui/logo-loader';

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
  initialData?: any;
}

export function FeedContainer({ categoryId: initialCategoryId, boardId, initialData }: FeedContainerProps) {
  const { selectedCategoryId, searchQuery } = useFeedFilter();
  const effectiveCategoryId = initialCategoryId !== undefined ? initialCategoryId : selectedCategoryId;
  const { setOnCreated, setOnDeleted } = useCreatePostModal();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const { isAuthenticated } = useAuth();

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
    limit: '12',
  }, {
    initialData: initialData ? { pages: [initialData], pageParams: [1] } : undefined
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

  return (
    <div className="w-full px-2 sm:px-4 lg:px-3 xl:px-3 2xl:px-3 py-2 md:py-3">
      {/* Visually hidden H1 for SEO stability across auth states */}
      <h1 className="sr-only">Vrutta — Discover Professional Ideas & Business Networking Feed</h1>
    
    
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in slide-in-from-top-4 duration-700">
          <LogoLoader size={64} className="mb-2" />
          <p className="text-secondary-400 text-sm font-medium animate-pulse">Curating your feed...</p>
        </div>
      )}

      {useDemoData && !isLoading && (
        <p className="text-center text-xs text-secondary-400 mb-4">
          Showing sample posts — create posts to see real content
        </p>
      )}

      <Masonry
        breakpointCols={breakpointCols}
        className="flex -ml-2 sm:-ml-2.5 md:-ml-3 w-auto"
        columnClassName="pl-2 sm:pl-2.5 md:pl-3 bg-clip-padding"
      >
        {isLoading ? (
          [...Array(12)].map((_, i) => (
            <div key={`skeleton-${i}`} className="mb-2 sm:mb-2.5 md:mb-3 space-y-3">
              <Skeleton
                className="w-full rounded-2xl bg-secondary-100 dark:bg-secondary-800"
                style={{ 
                  aspectRatio: ['4/5', '1/1', '3/4', '2/3'][i % 4],
                  height: 'auto'
                }}
              />
              <div className="flex items-center gap-2 px-1">
                <Skeleton className="w-6 h-6 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-2/3 rounded-full" />
                  <Skeleton className="h-2 w-1/2 rounded-full" />
                </div>
              </div>
            </div>
          ))
        ) : allPosts.length > 0 ? (
          allPosts.map((post, i) => (
            <div key={`post-wrapper-${post.id}`}>
              <div
                className={cn(
                  "mb-2 sm:mb-2.5 md:mb-3",
                  !isLoading && (i < 8 ? `animate-slide-up stagger-${(i % 4) + 1}` : "animate-slide-up")
                )}
              >
                <PostCard post={post} priority={i < 4} />
              </div>
              
              {i === 2 && isAuthenticated && (
                <div className="mb-2 sm:mb-2.5 md:mb-3 animate-slide-up stagger-4">
                  <TeammateSuggestions limit={4} />
                </div>
              )}
            </div>
          ))
        ) : null}
      </Masonry>

      {allPosts.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <ImageOff className="w-16 h-16 text-secondary-300 mb-4" />
          <h3 className="text-xl font-semibold text-secondary-700 dark:text-secondary-300 mb-2">No posts found</h3>
          <p className="text-secondary-500 max-w-sm">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search.`
              : 'No posts in this category yet. Be the first to post!'}
          </p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {isFetchingNextPage && (
        <div className="flex flex-col items-center justify-center py-12 gap-2 animate-in fade-in duration-500">
          <LogoLoader size={48} />
          <p className="text-secondary-400 text-xs font-medium">Loading more posts</p>
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && !useDemoData && !isLoading && (
        <p className="text-center text-sm text-secondary-400 py-8">
          You've seen all posts ✨
        </p>
      )}
    </div>
  );
}
