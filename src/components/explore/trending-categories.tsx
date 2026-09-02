'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrendingTags } from '@/hooks/use-api/use-tags';
import { useFeedFilter } from '@/hooks/use-feed';
import { cn, formatCompactNumber } from '@/lib/utils';

const DEFAULT_BANNER = '/images/placeholder-banner.svg';

export function TrendingCategories({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useTrendingTags(12, { initialData });
  const tags = data?.tags || [];
  const router = useRouter();
  const { setSearch } = useFeedFilter();

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

  const openTag = (tag: string) => {
    setSearch(tag);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 sm:gap-4 overflow-x-hidden px-4 sm:px-6 py-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="w-40 sm:w-44 h-[132px] rounded-2xl shrink-0" />
        ))}
      </div>
    );
  }

  if (tags.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <Flame className="w-4 h-4" />
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
              onClick={() => scrollBy(-320)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border border-secondary-200 dark:border-secondary-800 text-secondary-900 dark:text-white shadow-md transition-all hover:scale-105 active:scale-95 hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={() => scrollBy(320)}
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
              {tags.map((t, i) => {
                const bgImage = t.image || DEFAULT_BANNER;
                const rank = i + 1;
                const isHot = rank <= 3;
                return (
                  <div key={t.tag} className="flex-none min-w-0 snap-start">
                    <button
                      type="button"
                      onClick={() => openTag(t.tag)}
                      className="group flex flex-col w-40 sm:w-44 rounded-2xl overflow-hidden bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 shadow-sm hover:shadow-lg transition-all duration-300 select-none text-left"
                    >
                      {/* Banner */}
                      <div className="relative w-full h-20 sm:h-24 overflow-hidden shrink-0">
                        <img
                          src={bgImage}
                          alt={t.tag}
                          loading="lazy"
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        {/* Rank badge */}
                        <div
                          className={cn(
                            "absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white",
                            isHot
                              ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30"
                              : "bg-black/50 backdrop-blur-md"
                          )}
                        >
                          {rank}
                        </div>

                        {isHot && (
                          <div className="absolute top-2 right-2">
                            <Flame className="w-4 h-4 text-orange-400 drop-shadow" />
                          </div>
                        )}
                      </div>

                      {/* Text */}
                      <div className="p-3">
                        <p className="font-black text-sm text-secondary-900 dark:text-white truncate">
                          <span className="text-primary-500">#</span>{t.tag}
                        </p>
                        <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-wide mt-0.5">
                          {formatCompactNumber(t.count)} posts
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
