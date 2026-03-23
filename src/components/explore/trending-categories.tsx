'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles } from 'lucide-react';

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
      <div className="flex items-center justify-between px-4 sm:px-6">
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

      <div className="relative">
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 sm:px-6 no-scrollbar snap-x snap-mandatory">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/explore/${cat.slug}`}
              className="
                relative min-w-[240px] h-32 
                rounded-[2rem] overflow-hidden 
                group transition-all duration-500 hover:-translate-y-1 snap-start
                shadow-lg hover:shadow-2xl
              "
            >
              {/* Image */}
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url('${cat.banner || DEFAULT_BANNER}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl">
                    {cat.icon || '✨'}
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-amber-500 text-[10px] font-black text-white uppercase tracking-tighter">
                    Trending
                  </div>
                </div>
                
                <div className="space-y-0.5">
                  <h3 className="font-black text-white text-lg uppercase leading-tight drop-shadow-lg">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                    {cat._count.posts} Posts active
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
