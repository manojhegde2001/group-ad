import { CategoryCards } from '@/components/feed/category-cards';
import { Compass, Layout } from 'lucide-react';
import { TrendingCategories } from '@/components/explore/trending-categories';
import { SearchBar } from '@/components/layout/search-bar';
import { getCategoriesServer } from '@/services/server/category-service';

export default async function ExplorePage() {
  // Fetch initial data on server for SEO
  const [trendingData, allCategoriesData] = await Promise.all([
    getCategoriesServer({ trending: true, limit: 8 }),
    getCategoriesServer()
  ]);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] flex flex-col overflow-x-hidden pt-6 md:pt-0">
      {/* Mobile Fixed Search - Professional Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-secondary-950/95 backdrop-blur-xl px-4 py-3 border-b border-secondary-100 dark:border-secondary-800/50">
          <SearchBar className="w-full" autoFocus />
      </div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-secondary-50 dark:bg-secondary-900/20 border-b border-secondary-100 dark:border-secondary-900/50 px-4 sm:px-6 pt-2 pb-4 md:pt-4 md:pb-6">
        {/* Animated Background Element */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-20 dark:opacity-40 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-primary-400/30 blur-[100px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] rounded-full bg-violet-400/30 blur-[100px] animate-pulse [animation-delay:2s]" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-sm bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
            <Compass className="w-5 h-5 md:w-6 md:h-6" />
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-secondary-900 dark:text-white uppercase leading-none">
            Discovery <span className="text-primary-600 dark:text-primary-400 italic">Central</span>
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 text-[10px] sm:text-xs md:text-sm max-w-lg mx-auto font-black uppercase tracking-[0.2em] leading-relaxed opacity-80">
            The pulse of Vrutta. Find trending communities, local hubs, and premium creators.
          </p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#0a0a0f] space-y-6 py-4 md:py-6">
        {/* Section 1: Trending */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TrendingCategories initialData={trendingData} />
        </div>
        {/* Section 2: All Topics */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:400ms]">
            <div className="flex items-center gap-2 px-4 sm:px-6 mb-2">
                <div className="p-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400">
                    <Layout className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                    All Topics
                </h2>
            </div>
            <CategoryCards initialData={allCategoriesData} />
        </div>
      </div>
    </div>
  );
}
