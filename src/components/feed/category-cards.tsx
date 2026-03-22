'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  banner?: string | null;
}

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&q=80';

function CategorySkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="w-full aspect-[4/5] rounded-2xl md:rounded-3xl" />
        ))}
      </div>
    </div>
  );
}

export function CategoryCards() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CategorySkeleton />;
  if (categories.length === 0) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {categories.map((cat) => {
            const bgImage = cat.banner || DEFAULT_CATEGORY_IMAGE;

            return (
              <Link
                key={cat.id}
                href={`/explore/${cat.slug}`}
                className="
                  group/card relative
                  w-full aspect-[4/5]
                  overflow-hidden rounded-2xl md:rounded-3xl
                  shadow-md hover:shadow-xl
                  hover:-translate-y-1
                  transition-all duration-300
                  outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                "
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/card:scale-110"
                  style={{ backgroundImage: `url('${bgImage}')` }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity duration-300 group-hover/card:from-black/90" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-5">
                  <div className="flex flex-col gap-1.5 translate-y-2 group-hover/card:translate-y-0 transition-transform duration-300">
                    {cat.icon && (
                      <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                        <span className="text-lg sm:text-xl md:text-2xl">{cat.icon}</span>
                      </div>
                    )}
                    <h3 className="font-bold text-white tracking-tight leading-tight text-sm sm:text-base md:text-lg lg:text-xl drop-shadow-md text-left">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
