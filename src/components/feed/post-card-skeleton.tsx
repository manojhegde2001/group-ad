import { Skeleton } from '@/components/ui/skeleton';

interface PostCardSkeletonProps {
    aspectRatio?: string;
}

export function PostCardSkeleton({ aspectRatio = '1/1' }: PostCardSkeletonProps) {
    return (
        <div className="rounded-lg overflow-hidden bg-white dark:bg-secondary-900 shadow-sm border border-secondary-100/50 dark:border-secondary-800/30">
            <div className="relative overflow-hidden bg-secondary-50 dark:bg-secondary-800/30">
                <Skeleton
                    className="w-full rounded-none bg-secondary-100 dark:bg-secondary-800 min-h-[200px]"
                    style={{ aspectRatio, height: 'auto' }}
                />
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
