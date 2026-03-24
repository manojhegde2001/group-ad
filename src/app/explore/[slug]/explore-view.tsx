'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { FeedContainer } from '@/components/feed/feed-container';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function ExploreView({ category }: { category: Category }) {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-[#0a0a0f] pt-4 md:pt-4">
      {/* Breadcrumb Bar */}
      <div className="shrink-0 bg-white dark:bg-[#0a0a0f] border-b border-secondary-100 dark:border-secondary-900/50 shadow-sm">
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
  );
}
