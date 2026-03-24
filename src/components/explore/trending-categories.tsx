'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  banner?: string | null;
  _count: {
    posts: number;
  };
}

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80';

export function TrendingCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    fetch('/api/categories?trending=true&limit=8')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories?.slice(0, 8) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-hidden px-4 sm:px-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="min-w-[240px] h-32 rounded-3xl shrink-0" />
        ))}
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
              Trending Hubs
            </h2>
          </div>
          <Link 
              href="/explore" 
              className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest hover:underline"
          >
              View All
          </Link>
        </div>
      </div>

      <div className="relative group/carousel">
        <div className="max-w-7xl mx-auto relative">
          {/* Navigation Buttons */}
          {canScrollPrev && (
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border border-secondary-200 dark:border-white/10 text-secondary-900 dark:text-white shadow-2xl transition-all hover:scale-110 active:scale-90 hidden md:flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md border border-secondary-200 dark:border-white/10 text-secondary-900 dark:text-white shadow-2xl transition-all hover:scale-110 active:scale-90 hidden md:flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Embla Viewport */}
          <div className="overflow-hidden px-4 sm:px-6" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-6 pb-8">
              {categories.map((cat, idx) => (
                <div key={cat.id} className="flex-[0_0_280px] sm:flex-[0_0_340px] min-w-0">
                  <Link
                    href={`/explore/${cat.slug}`}
                    className="
                      relative block w-full h-48
                      rounded-[2.5rem] overflow-hidden 
                      group transition-all duration-700 hover:-translate-y-2
                      shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]
                      dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)]
                    "
                  >
                    {/* Background with parallax effect */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-125"
                      style={{ backgroundImage: `url('${cat.banner || DEFAULT_BANNER}')` }}
                    />
                    
                    {/* Layered Overlays */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-transparent transition-opacity duration-700 group-hover:opacity-60" />
                    <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Glass Rim */}
                    <div className="absolute inset-0 border border-white/10 rounded-[2.5rem] pointer-events-none" />

                    {/* Top Badge */}
                    <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
                      <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-2xl shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                        {cat.icon || '✨'}
                      </div>
                      <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-1.5 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                        Join <span className="text-primary-400">Hub</span>
                      </div>
                    </div>
                    
                    {/* Bottom Content */}
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 space-y-2 z-10 transition-transform duration-500 group-hover:translate-y-[-5px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                          <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em]">
                            Trending Now
                          </p>
                        </div>
                        <h3 className="font-black text-white text-xl sm:text-2xl uppercase leading-none tracking-tight drop-shadow-2xl">
                          {cat.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-3 pt-1">
                         <div className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 w-2/3 group-hover:w-full transition-all duration-1000" />
                         </div>
                         <p className="text-[11px] text-white font-black uppercase tracking-widest shrink-0">
                          {cat._count.posts} Active
                        </p>
                      </div>
                    </div>

                    {/* Hover Glow */}
                    <div className="absolute -inset-2 bg-primary-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
