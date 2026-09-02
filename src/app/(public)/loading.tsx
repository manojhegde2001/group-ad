'use client';

import { LogoLoader } from '@/components/ui/logo-loader';
import { FeedSkeleton } from '@/components/feed/feed-skeleton';
import { useWasAuthenticated } from '@/hooks/use-was-authenticated';

export default function Loading() {
  const wasAuthenticated = useWasAuthenticated();

  if (wasAuthenticated) {
    return (
      <div className="w-full px-2 sm:px-4 lg:px-3 xl:px-3 2xl:px-3 py-2 md:py-3">
        <FeedSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
      <div className="flex flex-col items-center justify-center animate-in fade-in duration-700">
        <LogoLoader size={72} className="mb-4" />
        <p className="text-secondary-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
          Vrutta
        </p>
      </div>
    </div>
  );
}
