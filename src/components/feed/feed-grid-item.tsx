'use client';

import { memo } from 'react';
import type { RenderComponentProps } from 'masonic';
import type { PostWithRelations } from '@/types';
import { PostCard } from './post-card';
import { PostCardSkeleton } from './post-card-skeleton';

export type FeedItem =
    | { type: 'post'; id: string; post: PostWithRelations; position: number }
    | { type: 'skeleton'; id: string; position: number };

/**
 * Render component for the masonic <Masonry> grid. Memoized so cards are not
 * re-rendered while other columns reflow.
 */
export const FeedGridItem = memo(function FeedGridItem({ data }: RenderComponentProps<FeedItem>) {
    if (data.type === 'skeleton') {
        return <PostCardSkeleton index={data.position} />;
    }
    return <PostCard post={data.post} priority={data.position < 4} />;
});
