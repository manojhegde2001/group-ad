import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useFeedFilter } from '@/hooks/use-feed';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
    className?: string;
    autoFocus?: boolean;
}

export function SearchBar({ className = '', autoFocus = false }: SearchBarProps) {
    const { searchQuery, setSearch } = useFeedFilter();
    const [localSearch, setLocalSearch] = useState(searchQuery);
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
                // className="w-full rounded-full bg-secondary-100 dark:bg-secondary-800 border-none hover:bg-secondary-200 transition-colors"
                // inputClassName="bg-transparent border-none focus:ring-0 placeholder:text-secondary-400 placeholder:font-medium text-[15px]"
            />
        </div>
    );
}
