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
                  overflow-hidden rounded-2xl md:rounded-[2rem]
                  shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.2)]
                  hover:-translate-y-2
                  transition-all duration-500 ease-[0.33,1,0.68,1]
                  outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  border border-secondary-100/50 dark:border-secondary-800/50
                "
              >
                {/* Background Image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/card:scale-110"
                  style={{ backgroundImage: `url('${bgImage}')` }}
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 group-hover/card:via-black/40" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-5 md:p-6">
                  <div className="flex flex-col gap-2 translate-y-4 group-hover/card:translate-y-0 transition-transform duration-500 ease-out">
                    {cat.icon && (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-14 md:h-14 rounded-2xl bg-white/10 backdrop-blur-xl flex items-center justify-center shrink-0 border border-white/20 shadow-xl mb-1 group-hover/card:scale-110 transition-transform duration-500">
                        <span className="text-xl sm:text-2xl md:text-3xl filter drop-shadow-lg">{cat.icon}</span>
                      </div>
                    )}
                    <h3 className="font-black text-white tracking-tight leading-tight text-base sm:text-lg md:text-xl lg:text-2xl drop-shadow-2xl text-left uppercase">
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
