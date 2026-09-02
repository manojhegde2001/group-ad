'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Masonry, useInfiniteLoader } from 'masonic';
import { useFeedFilter, useCreatePostModal } from '@/hooks/use-feed';
import { useInfinitePosts } from '@/hooks/use-api/use-posts';
import type { PostWithRelations } from '@/types';
import { ImageOff } from 'lucide-react';
import { FeedSkeleton } from './feed-skeleton';
import { FeedGridItem, type FeedItem } from './feed-grid-item';
import { TeammateSuggestions } from '@/components/widgets/TeammateSuggestions';
import { useAuth } from '@/hooks/use-auth';
import { useMounted } from '@/hooks/use-mounted';
import { useColumnCount } from '@/hooks/use-column-count';

// Demo posts used as fallback when DB is empty
const DEMO_POSTS: any[] = [];

interface FeedContainerProps {
  categoryId?: string | null;
  boardId?: string | null;
  initialData?: any;
  showSuggestions?: boolean;
}

export function FeedContainer({ categoryId: initialCategoryId, boardId, initialData, showSuggestions = true }: FeedContainerProps) {
  const { selectedCategoryId, searchQuery } = useFeedFilter();
  const effectiveCategoryId = initialCategoryId !== undefined ? initialCategoryId : selectedCategoryId;
  const { setOnCreated, setOnDeleted } = useCreatePostModal();
  const { isAuthenticated } = useAuth();
  const mounted = useMounted();
  const columnCount = useColumnCount();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfinitePosts({
    categoryId: effectiveCategoryId,
    boardId,
    search: searchQuery,
    visibility: 'PUBLIC',
    limit: '12',
  }, {
    initialData: initialData ? { pages: [initialData], pageParams: [1] } : undefined
  });

  const posts = useMemo(
    () => data?.pages.flatMap((page: any) => page.posts) ?? [],
    [data]
  );
  const isEmpty = !isLoading && posts.length === 0;
  const useDemoData = isEmpty && !searchQuery && !selectedCategoryId;
  const displayPosts = useDemoData ? DEMO_POSTS : posts;

  // Locally created / deleted posts, merged over the fetched list
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

    setOnDeleted((postId: string) => {
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
    });
  }, [setOnCreated, setOnDeleted]);

  const allPosts = useMemo(() => [
    ...localPosts,
    ...displayPosts.filter((p: any) => !localPosts.some(lp => lp.id === p.id)),
  ], [localPosts, displayPosts]);

  // One list for masonic: posts, followed by a short run of skeleton cards
  // while another page is available so the shortest columns keep filling.
  const feedItems = useMemo<FeedItem[]>(() => {
    if (isLoading) {
      return Array.from({ length: 18 }, (_, i) => ({ type: 'skeleton' as const, id: `sk-${i}`, position: i }));
    }
    const items: FeedItem[] = allPosts.map((post, i) => ({ type: 'post', id: post.id, post, position: i }));
    if (hasNextPage && !useDemoData) {
      const base = items.length;
      for (let i = 0; i < 8; i++) {
        items.push({ type: 'skeleton', id: `sk-more-${i}`, position: base + i });
      }
    }
    return items;
  }, [isLoading, allPosts, hasNextPage, useDemoData]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const maybeLoadMore = useInfiniteLoader(
    (_start: number, _stop: number, _items: FeedItem[]) => loadMore(),
    {
      isItemLoaded: (index: number, items: FeedItem[]) => items[index]?.type === 'post',
      minimumBatchSize: 12,
      threshold: 6,
    }
  );

  const gridKey = `${effectiveCategoryId ?? 'all'}|${boardId ?? ''}|${searchQuery ?? ''}`;
  const showEmptyState = mounted && !isLoading && allPosts.length === 0 && !useDemoData;

  return (
    <div className="w-full px-2 sm:px-4 lg:px-3 xl:px-3 2xl:px-3 py-2 md:py-3">
      {/* Visually hidden H1 for SEO stability across auth states */}
      <h1 className="sr-only">Vrutta — Discover Professional Ideas & Business Ecosysteming Feed</h1>

      {useDemoData && !isLoading && (
        <p className="text-center text-xs text-secondary-400 mb-4">
          Showing sample posts — create posts to see real content
        </p>
      )}

      {showSuggestions && isAuthenticated && !isLoading && allPosts.length > 0 && (
        <div className="mb-4 animate-slide-up">
          <TeammateSuggestions limit={10} />
        </div>
      )}

      {!mounted ? (
        // Pre-hydration: CSS-column skeletons (balanced, SSR-safe)
        <FeedSkeleton />
      ) : feedItems.length > 0 ? (
        <Masonry
          key={gridKey}
          items={feedItems}
          columnCount={columnCount}
          columnGutter={6}
          rowGutter={6}
          overscanBy={3}
          itemHeightEstimate={320}
          itemKey={(item: FeedItem) => item.id}
          render={FeedGridItem}
          onRender={maybeLoadMore}
        />
      ) : null}

      {showEmptyState && (
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

      {!hasNextPage && allPosts.length > 0 && !useDemoData && !isLoading && (
        <p className="text-center text-sm text-secondary-400 py-8">
          You&apos;ve seen all posts ✨
        </p>
      )}
    </div>
  );
}
