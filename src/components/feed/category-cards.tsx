'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useCategories } from '@/hooks/use-api/use-categories';

const DEFAULT_CATEGORY_IMAGE = '/images/placeholder-banner.svg';

function CategorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 md:py-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CategoryCards({ initialData }: { initialData?: any }) {
  const { data, isLoading } = useCategories(undefined, { initialData });
  const categories = data?.categories || [];

  if (isLoading) return <CategorySkeleton />;
  if (categories.length === 0) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 md:py-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5">
          {categories.map((cat: any) => {
            const bgImage = cat.banner || DEFAULT_CATEGORY_IMAGE;

            return (
              <Link
                key={cat.id}
                href={`/explore/${cat.slug}`}
                className="
                  group relative
                  w-full aspect-[4/3]
                  overflow-hidden rounded-xl
                  bg-secondary-100 dark:bg-secondary-800
                  transition-all duration-300 ease-out
                "
              >
                {/* Image Container with Blur-Fill Strategy */}
                <div className="absolute inset-0 bg-secondary-100 dark:bg-secondary-900 overflow-hidden">
                  {/* Blurred Backdrop to fill empty space without solid color bars */}
                  <div
                    className="absolute inset-[-20%] bg-cover bg-center opacity-60 dark:opacity-40 blur-xl scale-110 transition-transform duration-500 ease-out group-hover:scale-125"
                    style={{ backgroundImage: `url('${bgImage}')` }}
                  />
                  {/* Foreground Image using contain to prevent cropping */}
                  <img
                    src={bgImage}
                    alt={cat.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Subdued Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end pointer-events-none">
                  <h3 className="font-bold text-white tracking-tight leading-tight text-base sm:text-lg lg:text-xl drop-shadow-sm">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
