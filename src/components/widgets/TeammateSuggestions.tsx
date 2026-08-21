'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { ShieldCheck, Zap, ArrowRight, UserPlus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSuggestions } from '@/hooks/use-api/use-user';
import { useConnectMutation } from '@/hooks/use-api/use-connections';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TeammateSuggestionsProps {
    className?: string;
    limit?: number;
}

export const TeammateSuggestions = memo(function TeammateSuggestions({ className, limit = 5 }: TeammateSuggestionsProps) {
    const { data: suggestions, isLoading } = useSuggestions();
    const connectMutation = useConnectMutation();

    if (isLoading) {
        return (
            <div className={cn("p-6 rounded-[2.5rem] bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800", className)}>
                <div className="flex items-center gap-3 mb-6">
                    <Skeleton className="w-9 h-9 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
                    </div>
                </div>
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-3/4" />
                                <Skeleton className="h-2 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!suggestions || suggestions.length === 0) return null;

    const displaySuggestions = suggestions.slice(0, limit);

    return (
        <div className={cn(
            "p-6 rounded-[2.5rem] bg-gradient-to-br from-primary-50/50 via-white to-white dark:from-primary-950/10 dark:via-secondary-900 dark:to-secondary-900 border border-primary-100/50 dark:border-secondary-800 shadow-sm",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary-500/20">
                        <Zap className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                            Alliance Discovery
                        </h3>
                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mt-0.5 leading-none">
                            Expand your connections
                        </p>
                    </div>
                </div>
                <Users className="w-4 h-4 text-secondary-300 dark:text-secondary-600" />
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
                {displaySuggestions.map((user) => (
                    <div
                        key={user.id}
                        className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-secondary-800/60 border border-transparent hover:border-secondary-100 dark:hover:border-secondary-700/50 transition-all duration-300"
                    >
                        <Link href={`/profile/${user.username}`} className="relative shrink-0">
                            <Avatar
                                src={user.avatar}
                                name={user.companyName || user.name}
                                rounded="xl"
                                className="w-10 h-10 ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all"
                            />
                            {user.verificationStatus === 'VERIFIED' && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-secondary-900 rounded-full flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                </div>
                            )}
                        </Link>
                        
                        <div className="flex-1 min-w-0">
                            <Link href={`/profile/${user.username}`}>
                                <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate group-hover:text-primary-500 transition-colors">
                                    {user.companyName || user.name}
                                </p>
                            </Link>
                            <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest truncate mt-0.5">
                                {user.companyName ? 'Business Partner' : 'Professional Partner'}
                            </p>
                            {user.suggestionReason && (
                                <p className="text-[8px] font-medium text-primary-400 dark:text-primary-600 uppercase tracking-tight mt-0.5">
                                    {user.suggestionReason}
                                </p>
                            )}
                        </div>

                        <Button
                            size="sm"
                            variant="flat"
                            color="primary"
                            className="h-8 w-8 p-0 rounded-xl shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => connectMutation.mutate({ receiverId: user.id })}
                            disabled={connectMutation.isPending}
                        >
                            <UserPlus className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            <Link
                href="/explore"
                className="mt-5 group flex items-center justify-center gap-2 py-3 w-full rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 hover:bg-secondary-100 dark:hover:bg-secondary-800 text-[10px] font-black text-secondary-600 dark:text-secondary-400 uppercase tracking-widest transition-all"
            >
                Discover More
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>
    );
});
