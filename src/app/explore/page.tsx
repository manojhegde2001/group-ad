'use client';

import { CategoryCards } from '@/components/feed/category-cards';
import { Compass } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex flex-col overflow-x-hidden pt-4 md:pt-4">
      {/* Hero */}
      <div className="bg-secondary-50 dark:bg-secondary-900/20 border-b border-secondary-100 dark:border-secondary-900/50 px-4 sm:px-6 pt-10 pb-10 md:pt-14 md:pb-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-3xl shadow-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Compass className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-secondary-900 dark:text-white">
            Explore Ideas
          </h1>

          <p className="text-secondary-500 dark:text-secondary-400 text-base sm:text-lg md:text-xl max-w-xl mx-auto font-medium leading-relaxed">
            Pick a topic to discover trending posts, new creators, and inspiring
            content curated just for you.
          </p>
        </div>
      </div>

      {/* Category Cards */}
      <div className="flex-1 bg-white dark:bg-[#0a0a0f] pb-24">
        <CategoryCards />
      </div>
    </div>
  );
}
