import { Skeleton } from '@/components/ui/skeleton';

interface PostCardSkeletonProps {
    index?: number;
}

// Varied heights — masonic balances columns by shortest-column placement,
// so the spread only needs to feel like real content, not stay even.
const HEIGHTS = [232, 300, 208, 344, 260, 372, 220, 312, 244, 332, 284, 292];

// Muted editorial palette (light block / dark block) — designed, not loud.
const TINTS = [
    'bg-[#DAC7AE] dark:bg-[#37301F]', // clay
    'bg-[#AFC4B4] dark:bg-[#25322B]', // sage
    'bg-[#A2B7C6] dark:bg-[#24303A]', // dusty blue
    'bg-[#CBAAA6] dark:bg-[#382A28]', // dusty rose
    'bg-[#D8C79A] dark:bg-[#37311E]', // ochre
    'bg-[#B2A6C6] dark:bg-[#2C2739]', // plum
];

export function PostCardSkeleton({ index = 0 }: PostCardSkeletonProps) {
    const height = HEIGHTS[index % HEIGHTS.length];
    const tint = TINTS[index % TINTS.length];

    return (
        <div className="rounded-lg overflow-hidden bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100/50 dark:border-secondary-800/30">
            <div className={`relative overflow-hidden ${tint}`} style={{ height }}>
                {/* depth */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-black/10 dark:from-white/5 dark:to-black/20" />
                {/* shimmer sweep */}
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/40 dark:via-white/10 to-transparent" />
            </div>
            <div className="px-2 md:px-4 py-2.5 md:py-3 flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0 space-y-1.5">
                    <Skeleton className="h-3 w-full rounded-full" />
                    <Skeleton className="h-3 w-2/3 rounded-full" />
                </div>
                <div className="shrink-0 pt-0.5">
                    <Skeleton className="w-6 h-6 rounded-full" />
                </div>
            </div>
        </div>
    );
}
