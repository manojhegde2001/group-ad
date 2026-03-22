'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FeedContainer } from '@/components/feed/feed-container';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryExplorePage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => {
          const found = (d.categories || []).find((c: Category) => c.slug === slug);
          setCategory(found || null);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto pt-4 md:pt-4">
          {/* Skeleton breadcrumb */}
          <div className="h-12 md:h-14 bg-white/90 dark:bg-[#0a0a0f]/90 border-b border-secondary-100 dark:border-secondary-900/50 animate-pulse shrink-0" />
          {/* Skeleton feed */}
          <div className="flex-1 p-8">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="h-8 w-48 bg-secondary-200 dark:bg-secondary-800 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-64 bg-secondary-100 dark:bg-secondary-800/50 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="flex-1 flex flex-col overflow-y-auto pt-4 md:pt-4">
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <h2 className="text-2xl font-bold text-secondary-900 dark:text-white mb-4">
              Category not found
            </h2>
            <Link
              href="/explore"
              className="px-6 py-2 bg-primary-600 text-white rounded-full font-bold hover:bg-primary-700 transition-colors"
            >
              Back to Explore
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 
        Sidebar is rendered by the layout — nothing needed here.
        This div is the main content column only.
      */}
      <div className="flex-1 flex flex-col overflow-y-auto pt-4 md:pt-4 overflow-x-hidden">

        {/* 
          Breadcrumb Bar
          sticky top-0 works here because overflow-y-auto on the parent
          creates a local scroll context — sidebar is never affected.
        */}
        <div className="sticky top-0 z-30 shrink-0 bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md border-b border-secondary-100 dark:border-secondary-900/50 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-3 px-4 sm:px-6 h-12 md:h-14">
            <Link
              href="/explore"
              className="flex items-center gap-1.5 shrink-0 p-1.5 -ml-1.5 rounded-full text-sm font-medium text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Explore</span>
            </Link>

            <div className="h-5 w-px shrink-0 bg-secondary-200 dark:bg-secondary-700" />

            <h2 className="text-base sm:text-lg md:text-xl font-bold text-secondary-900 dark:text-white truncate">
              {category.name}
            </h2>
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 bg-secondary-50 dark:bg-[#0a0a0f] pb-24">
          <FeedContainer categoryId={category.id} />
        </div>

      </div>
    </div>
  );
}
