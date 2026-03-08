'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useFeedFilter } from '@/hooks/use-feed';

interface SearchBarProps {
    className?: string;
    autoFocus?: boolean;
}

export function SearchBar({ className = '', autoFocus = false }: SearchBarProps) {
    const { searchQuery, setSearch } = useFeedFilter();
    const [localSearch, setLocalSearch] = useState(searchQuery);
    const [searchFocused, setSearchFocused] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Sync localSearch when the Zustand searchQuery is reset externally (e.g. category change)
    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setSearch(val), 400);
    };

    const clearSearch = () => {
        setLocalSearch('');
        setSearch('');
    };

    return (
        <div className={`relative ${className}`}>
            <div
                className={`flex items-center gap-2 bg-secondary-100 dark:bg-secondary-800 rounded-full px-4 py-2 transition-all duration-200 ${searchFocused
                        ? 'ring-2 ring-primary-400 bg-white dark:bg-secondary-700 shadow-sm'
                        : 'hover:bg-secondary-200 dark:hover:bg-secondary-700'
                    }`}
            >
                <Search className="w-4 h-4 text-secondary-400 shrink-0" />
                <input
                    type="text"
                    value={localSearch}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search posts, people, ideas…"
                    autoFocus={autoFocus}
                    className="flex-1 bg-transparent outline-none text-sm text-secondary-800 dark:text-secondary-100 placeholder:text-secondary-400 min-w-0"
                />
                {localSearch && (
                    <button
                        onClick={clearSearch}
                        className="text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors shrink-0"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}
