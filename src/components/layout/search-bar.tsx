'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { Popover, Text } from 'rizzui';
import { useFeedFilter } from '@/hooks/use-feed';
import { useMainSearch } from '@/hooks/use-api/use-search';
import { Input } from '@/components/ui/input';
import { AppImage } from '@/components/ui/app-image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/services/api/search';

interface SearchBarProps {
    className?: string;
    autoFocus?: boolean;
}

const TYPE_LABEL: Record<SearchResult['type'], string> = {
    post: 'Post',
    event: 'Event',
    company: 'Business',
};

const TYPE_BADGE_CLASS: Record<SearchResult['type'], string> = {
    post: 'text-primary bg-primary/10',
    event: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10',
    company: 'text-amber-600 dark:text-amber-400 bg-amber-500/10',
};

function ResultThumb({ res, size }: { res: SearchResult; size: 'sm' | 'md' }) {
    const boxClass = size === 'sm' ? 'w-[34px] h-[34px] rounded-lg' : 'w-12 h-12 rounded-xl';

    if (res.type === 'event') {
        const date = res.date ? new Date(res.date) : null;
        return (
            <div className={cn(boxClass, 'shrink-0 flex flex-col items-center justify-center bg-secondary-100 dark:bg-secondary-800 leading-none')}>
                {date && (
                    <>
                        <span className={cn('font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400', size === 'sm' ? 'text-[7px]' : 'text-[8.5px]')}>
                            {date.toLocaleDateString(undefined, { month: 'short' })}
                        </span>
                        <span className={cn('font-black text-secondary-900 dark:text-white tabular-nums', size === 'sm' ? 'text-xs' : 'text-base')}>
                            {date.getDate()}
                        </span>
                    </>
                )}
            </div>
        );
    }

    if (res.type === 'company') {
        if (res.logo) {
            return (
                <div className={cn(boxClass, 'shrink-0 relative overflow-hidden')}>
                    <AppImage src={res.logo} alt="" fill className="object-cover" />
                </div>
            );
        }
        return (
            <div className={cn(boxClass, 'shrink-0 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-black', size === 'sm' ? 'text-xs' : 'text-base')}>
                {res.title.charAt(0).toUpperCase()}
            </div>
        );
    }

    // post
    if (res.image) {
        return (
            <div className={cn(boxClass, 'shrink-0 relative overflow-hidden')}>
                <AppImage src={res.image} alt="" fill className="object-cover" />
            </div>
        );
    }
    return (
        <div className={cn(boxClass, 'shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-700')}>
            <FileText className={size === 'sm' ? 'w-3.5 h-3.5 text-white' : 'w-[18px] h-[18px] text-white'} />
        </div>
    );
}

function ResultRow({ res, size, onNavigate }: { res: SearchResult; size: 'sm' | 'md'; onNavigate: () => void }) {
    return (
        <Link
            href={res.href}
            onClick={onNavigate}
            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all"
        >
            <ResultThumb res={res} size={size} />
            <div className="flex-1 min-w-0">
                <p className={cn('font-bold text-secondary-900 dark:text-white truncate', size === 'sm' ? 'text-xs' : 'text-[13px]')}>
                    {res.title}
                </p>
                {size === 'sm' ? (
                    <p className="text-[10px] text-secondary-400 font-medium truncate mt-0.5">
                        {TYPE_LABEL[res.type]} · {res.subtitle}
                    </p>
                ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                        <span className={cn('text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0', TYPE_BADGE_CLASS[res.type])}>
                            {TYPE_LABEL[res.type]}
                        </span>
                        <span className="text-[10px] text-secondary-400 font-medium truncate">{res.subtitle}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

function SkeletonResultRow({ size }: { size: 'sm' | 'md' }) {
    const boxClass = size === 'sm' ? 'w-[34px] h-[34px] rounded-lg' : 'w-12 h-12 rounded-xl';
    return (
        <div className="flex items-center gap-3 px-2 py-2">
            <Skeleton className={cn(boxClass, 'shrink-0')} />
            <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className={cn('rounded-full w-2/3', size === 'sm' ? 'h-3' : 'h-3.5')} />
                <Skeleton className="h-2.5 w-1/3 rounded-full" />
            </div>
        </div>
    );
}

const GROUP_ORDER: { type: SearchResult['type']; label: string }[] = [
    { type: 'post', label: 'Posts' },
    { type: 'event', label: 'Events' },
    { type: 'company', label: 'Businesses' },
];

export function SearchBar({ className = '', autoFocus = false }: SearchBarProps) {
    const { searchQuery, setSearch } = useFeedFilter();
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isPending, setIsPending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Sync localSearch when the Zustand searchQuery is reset externally (e.g. category change)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local input from the shared search store when it's reset externally
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const { data, isFetching } = useMainSearch(debouncedQuery);
    const results = data?.results || [];
    // Covers both the debounce wait (isPending) and the request itself (isFetching), so
    // there's no gap where old/no results sit on screen while something is actually happening.
    const loading = isPending || isFetching;

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        // Also filters the home feed, when it's mounted, as a side effect
        setSearch(val);

        if (val.trim().length >= 2) setIsPending(true);

        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            setIsPending(false);
            setDebouncedQuery(val.trim());
        }, 400);
    };

    const clearSearch = () => {
        setLocalSearch('');
        setSearch('');
        setIsPending(false);
        setDebouncedQuery('');
    };

    const handleResultNavigate = () => {
        clearSearch();
        setIsOpen(false);
    };

    return (
        <Popover placement="bottom-start" showArrow={false} isOpen={isOpen} setIsOpen={setIsOpen}>
            <Popover.Trigger>
                <div className={`relative ${className}`}>
                    <Input
                        type="text"
                        value={localSearch}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search"
                        autoFocus={autoFocus}
                        variant="flat"
                        rounded="pill"
                        size="md"
                        prefix={<Search className="w-4 h-4 text-secondary-500" />}
                        clearable={!!localSearch}
                        onClear={clearSearch}
                        inputClassName="bg-secondary-100 dark:bg-secondary-800"
                    />
                </div>
            </Popover.Trigger>
            <Popover.Content className="p-3 w-[calc(100vw-1.5rem)] md:w-[460px] bg-background rounded-2xl shadow-2xl border border-secondary-100 dark:border-secondary-800">
                {/* Popover.Content caches its children across renders, so a plain state
                    update while it's already open doesn't reliably reflect fresh results —
                    forcing a new key on every meaningful state change makes it remount instead. */}
                <div key={`${localSearch.trim()}-${loading}-${results.length}`} className="space-y-3">
                    {localSearch.trim().length < 2 ? (
                        <div className="text-center py-6 text-xs text-secondary-400 font-bold">
                            Type at least 2 characters to search
                        </div>
                    ) : loading ? (
                        <>
                            <div className="md:hidden space-y-0.5">
                                {[...Array(4)].map((_, i) => <SkeletonResultRow key={i} size="sm" />)}
                            </div>
                            <div className="hidden md:block space-y-0.5">
                                {[...Array(4)].map((_, i) => <SkeletonResultRow key={i} size="md" />)}
                            </div>
                        </>
                    ) : results.length === 0 ? (
                        <div className="text-center py-6 text-xs text-secondary-400 font-bold">
                            No results for &quot;{localSearch}&quot;
                        </div>
                    ) : (
                        <>
                            {/* Compact flat list — phones */}
                            <div className="md:hidden">
                                <Text className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-2 px-1">
                                    Search Results
                                </Text>
                                <div className="space-y-0.5">
                                    {results.map((res) => (
                                        <ResultRow key={`${res.type}-${res.id}`} res={res} size="sm" onNavigate={handleResultNavigate} />
                                    ))}
                                </div>
                            </div>

                            {/* Grouped by type — larger screens */}
                            <div className="hidden md:block space-y-1">
                                {GROUP_ORDER.map(({ type, label }) => {
                                    const group = results.filter((r) => r.type === type);
                                    if (group.length === 0) return null;
                                    return (
                                        <div key={type}>
                                            <Text className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1 px-1">
                                                {label}
                                            </Text>
                                            <div className="space-y-0.5 mb-2">
                                                {group.map((res) => (
                                                    <ResultRow key={`${res.type}-${res.id}`} res={res} size="md" onNavigate={handleResultNavigate} />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </Popover.Content>
        </Popover>
    );
}
