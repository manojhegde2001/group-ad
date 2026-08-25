'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { ShieldCheck, Zap, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestions } from '@/hooks/use-api/use-user';
import { useConnectMutation } from '@/hooks/use-api/use-connections';
import { Skeleton } from '@/components/ui/skeleton';

interface TeammateSuggestionsProps {
    className?: string;
    limit?: number;
}

export const TeammateSuggestions = memo(function TeammateSuggestions({ className, limit = 10 }: TeammateSuggestionsProps) {
    const { data: suggestions, isLoading } = useSuggestions();
    const connectMutation = useConnectMutation();

    if (isLoading) {
        return (
            <div className={cn("py-1", className)}>
                <div className="flex items-center gap-2 mb-3 px-1">
                    <Skeleton className="w-7 h-7 rounded-lg" />
                    <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex gap-3 overflow-hidden px-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="shrink-0 w-[92px] flex flex-col items-center gap-2">
                            <Skeleton className="w-14 h-14 rounded-full" />
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-6 w-full rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) return null;

    const displaySuggestions = suggestions.slice(0, limit);

    return (
        <div className={cn("py-1", className)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-7 h-7 rounded-lg bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
                    <Zap className="w-3.5 h-3.5 fill-current" />
                </div>
                <h3 className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                    Alliance Discovery
                </h3>
            </div>

            {/* Horizontal scroll row */}
            <div
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-1"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {displaySuggestions.map((user) => (
                    <div
                        key={user.id}
                        className="group shrink-0 w-[92px] snap-start flex flex-col items-center gap-2 p-2.5 rounded-2xl bg-secondary-50/60 dark:bg-secondary-800/30 border border-secondary-100 dark:border-secondary-800/50 hover:border-primary-200 dark:hover:border-primary-800/50 transition-colors"
                    >
                        <Link href={`/profile/${user.username}`} className="relative shrink-0">
                            <Avatar
                                src={user.avatar}
                                name={user.companyName || user.name}
                                rounded="full"
                                className="w-14 h-14 ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all"
                            />
                            {user.userType === 'BUSINESS' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-secondary-900 rounded-full flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                </div>
                            )}
                        </Link>

                        <Link href={`/profile/${user.username}`} className="w-full">
                            <p className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate text-center">
                                {user.companyName || user.name}
                            </p>
                        </Link>

                        <button
                            onClick={() => connectMutation.mutate({ receiverId: user.id })}
                            disabled={connectMutation.isPending}
                            className="w-full h-7 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                            title="Connect"
                        >
                            <UserPlus className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
});
