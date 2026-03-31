'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-api/use-categories';

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&q=80';

function CategorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[4/5] rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export function CategoryCards() {
  const { data, isLoading } = useCategories();
  const categories = data?.categories || [];

  if (isLoading) return <CategorySkeleton />;
  if (categories.length === 0) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 md:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
          {categories.map((cat: any) => {
            const bgImage = cat.banner || DEFAULT_CATEGORY_IMAGE;

            return (
              <Link
                key={cat.id}
                href={`/explore/${cat.slug}`}
                className="
                  group/card relative
                  w-full aspect-[3/4]
                  overflow-hidden rounded-2xl
                  shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.25)]
                  hover:-translate-y-3
                  transition-all duration-700 cubic-bezier(0.2, 0, 0, 1)
                  border border-secondary-100/50 dark:border-secondary-800/30
                "
              >
                {/* Image Layer */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover/card:scale-110"
                  style={{ backgroundImage: `url('${bgImage}')` }}
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-950/90 via-secondary-900/20 to-transparent transition-opacity duration-700 group-hover/card:opacity-90" />
                <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="space-y-4 group-hover/card:scale-105 transition-transform duration-500">
                    {cat.icon && (
                      <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-[2rem] bg-white/10 backdrop-blur-2xl flex items-center justify-center border border-white/20 shadow-2xl transition-all duration-700 group-hover/card:rotate-[10deg] group-hover/card:bg-white/20">
                        <span className="text-3xl sm:text-4xl filter drop-shadow-xl">{cat.icon}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <h3 className="font-black text-white tracking-tight leading-none text-xl sm:text-2xl uppercase drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                        {cat.name}
                      </h3>
                      <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] opacity-0 group-hover/card:opacity-100 transition-opacity duration-500">
                        Explore Hub
                      </p>
                    </div>
                  </div>
                </div>

                {/* Intersection Line */}
                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-primary-500 translate-y-full group-hover/card:translate-y-0 transition-transform duration-500" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
