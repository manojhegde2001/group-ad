import { PostCardSkeleton } from './post-card-skeleton';
import { cn } from '@/lib/utils';

interface FeedSkeletonProps {
    count?: number;
    className?: string;
}

/**
 * Balanced CSS-column skeleton for the feed. Used before the masonic grid
 * mounts and as the route loading fallback. `column-fill: balance` keeps the
 * column bottoms roughly even, and identical skeleton content makes the flow
 * order irrelevant. No hooks — safe in server components.
 */
export function FeedSkeleton({ count = 12, className }: FeedSkeletonProps) {
    return (
        <div
            className={cn(
                'columns-2 md:columns-3 xl:columns-4 2xl:columns-5 gap-1.5 [column-fill:balance]',
                className
            )}
        >
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="mb-1.5 break-inside-avoid">
                    <PostCardSkeleton index={i} />
                </div>
            ))}
        </div>
    );
}
