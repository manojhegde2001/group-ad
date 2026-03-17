'use client';

import { CategoryBar } from '@/components/feed/category-bar';
import { FeedContainer } from '@/components/feed/feed-container';
import { Compass } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-secondary-950">
      {/* Hero / Header */}
      <div className="bg-secondary-50 dark:bg-secondary-900/50 py-12 px-4 border-b border-secondary-100 dark:border-secondary-800">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl mb-2">
            <Compass className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-secondary-900 dark:text-white tracking-tight">
            Explore the World’s Ideas
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-lg max-w-2xl mx-auto font-medium">
            Discover trending topics, new creators, and inspiring content curated just for you.
          </p>
        </div>
      </div>

      {/* Categories Section */}
      <div className="sticky top-16 md:top-20 z-40 bg-white/80 dark:bg-secondary-950/80 backdrop-blur-xl border-b border-secondary-100 dark:border-secondary-800 py-2">
        <CategoryBar />
      </div>

      {/* Feed Container */}
      <div className="pt-4 pb-20">
        <FeedContainer />
      </div>
    </div>
  );
}
