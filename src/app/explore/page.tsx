'use client';

import { CategoryCards } from '@/components/feed/category-cards';
import { Compass, Layout } from 'lucide-react';
import { TrendingCategories } from '@/components/explore/trending-categories';
import { FeaturedVenues } from '@/components/explore/featured-venues';

export default function ExplorePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex flex-col overflow-x-hidden pt-4 md:pt-4">
      {/* Hero */}
      <div className="relative overflow-hidden bg-secondary-50 dark:bg-secondary-900/20 border-b border-secondary-100 dark:border-secondary-900/50 px-4 sm:px-6 pt-12 pb-12 md:pt-20 md:pb-16">
        {/* Animated Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20 dark:opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-primary-400/30 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-violet-400/30 blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-3xl shadow-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Compass className="w-7 h-7 md:w-8 md:h-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-secondary-900 dark:text-white uppercase leading-none">
            Discovery <span className="text-primary-600 dark:text-primary-400 italic">Central</span>
          </h1>

          <p className="text-secondary-500 dark:text-secondary-400 text-xs sm:text-sm md:text-base max-w-lg mx-auto font-black uppercase tracking-[0.3em] leading-relaxed opacity-80">
            The pulse of Group Ad. Find trending communities, local hubs, and premium creators.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0a0a0f] space-y-12 py-10 pb-24">
        {/* Section 1: Trending */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TrendingCategories />
        </div>

        {/* Section 2: Featured Venues */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:200ms]">
            <FeaturedVenues />
        </div>

        {/* Section 3: All Categories */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms]">
            <div className="flex items-center gap-2 px-4 sm:px-6 mb-2">
                <div className="p-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400">
                    <Layout className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                    All Topics
                </h2>
            </div>
            <CategoryCards />
        </div>
      </div>
    </div>
  );
}
