'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCategories } from '@/hooks/use-api/use-categories';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';

export function TrendingCategories({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useCategories({ trending: true, limit: 12 }, { initialData });
  const categories = data?.categories || [];
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollPrev(scrollLeft > 0);
      setCanScrollNext(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

  const scrollBy = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-hidden px-4 sm:px-6 py-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-48 h-14 rounded-full shrink-0" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
            Trending Hubs
          </h2>
        </div>
      </div>

      <div className="relative group/carousel">
        <div className="max-w-7xl mx-auto relative">
          {/* Navigation Buttons */}
          {canScrollPrev && (
            <button
              onClick={() => scrollBy(-300)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-white shadow-md transition-all hover:scale-105 active:scale-95 hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={() => scrollBy(300)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-white shadow-md transition-all hover:scale-105 active:scale-95 hidden md:flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Viewport */}
          <div 
             className="overflow-x-auto px-4 sm:px-6 flex gap-3 sm:gap-4 pb-4 pt-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
             ref={scrollRef} 
             onScroll={checkScroll}
          >
              {categories.map((cat: any) => {
                const bgImage = cat.banner || DEFAULT_BANNER;
                return (
                  <div key={cat.id} className="flex-none min-w-0 snap-start">
                    <Link
                      href={`/explore/${cat.slug}`}
                      draggable={false}
                      className="
                        flex items-center gap-3 p-1.5 pr-5
                        bg-white dark:bg-secondary-900 
                        hover:bg-secondary-50 dark:hover:bg-secondary-800
                        border border-secondary-100 dark:border-secondary-800
                        rounded-full transition-colors duration-200
                        shadow-sm hover:shadow select-none
                      "
                    >
                      <img 
                        src={bgImage} 
                        alt={cat.name}
                        loading="lazy"
                        draggable={false}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover shrink-0 bg-secondary-100 dark:bg-secondary-800 pointer-events-none" 
                      />
                      <span className="font-semibold text-sm sm:text-base text-secondary-900 dark:text-white whitespace-nowrap pointer-events-none">
                        {cat.name}
                      </span>
                    </Link>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

