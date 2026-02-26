'use client';

import { useState, useEffect, useRef } from 'react';
import { useFeedFilter } from '@/hooks/use-feed';
import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

export function CategoryBar() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedCategoryId, setCategory } = useFeedFilter();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    useEffect(() => {
        fetch('/api/categories')
            .then((r) => r.json())
            .then((d) => setCategories(d.categories || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [categories]);

    const scroll = (dir: 'left' | 'right') => {
        scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="sticky top-[57px] z-40 bg-white/90 dark:bg-secondary-950/90 backdrop-blur-md border-b border-secondary-100 dark:border-secondary-800/50">
                <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-hidden">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="shrink-0 h-8 w-20 bg-secondary-100 dark:bg-secondary-800 rounded-full animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (categories.length === 0) return null;

    const allCategories = [
        { id: null as any, name: 'All', slug: 'all', icon: null },
        ...categories,
    ];

    return (
        <div className="sticky top-[57px] z-40 bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md border-b border-secondary-100 dark:border-secondary-800/50">
            <div className="max-w-7xl mx-auto px-4 relative">
                {/* Left fade + scroll button */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 z-10 bg-gradient-to-r from-white dark:from-[#0a0a0f] to-transparent w-16">
                        <button
                            onClick={() => scroll('left')}
                            className="p-1 bg-white dark:bg-secondary-800 rounded-full shadow border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-secondary-600" />
                        </button>
                    </div>
                )}

                {/* Pills */}
                <div
                    ref={scrollRef}
                    className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {allCategories.map((cat) => {
                        const active = selectedCategoryId === cat.id;
                        return (
                            <button
                                key={cat.id ?? 'all'}
                                onClick={() => setCategory(cat.id)}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${active
                                        ? 'bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 shadow-md'
                                        : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700'
                                    }`}
                            >
                                {cat.id === null ? (
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                ) : cat.icon ? (
                                    <span>{cat.icon}</span>
                                ) : null}
                                {cat.name}
                            </button>
                        );
                    })}
                </div>

                {/* Right fade + scroll button */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 z-10 bg-gradient-to-l from-white dark:from-[#0a0a0f] to-transparent w-16 justify-end">
                        <button
                            onClick={() => scroll('right')}
                            className="p-1 bg-white dark:bg-secondary-800 rounded-full shadow border border-secondary-200 dark:border-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-secondary-600" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
