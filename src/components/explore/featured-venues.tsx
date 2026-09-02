'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useVenues } from '@/hooks/use-api/use-venues';

export function FeaturedVenues() {
  const { user } = useAuth();

  // Queries
  const { data, isLoading } = useVenues();
  const venues = data?.venues?.slice(0, 4) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  if (venues.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
            <Building2 className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
            Discovery Spaces
          </h2>
        </div>
        <div className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
            {venues.length} Spaces Available
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6">
        {venues.map((venue: any) => {
          const isNearby = (user as any)?.location?.toLowerCase().includes(venue.city.toLowerCase());

          return (
            <div
              key={venue.id}
              className="
                group relative h-64
                rounded-[2rem] overflow-hidden
                bg-secondary-50 dark:bg-secondary-900/40
                border border-secondary-100 dark:border-secondary-800
                transition-all duration-500 hover:shadow-2xl
              "
            >
              {/* Gradient header — venues have no imagery in the data model */}
              <div className="absolute inset-0 h-full w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-primary-600 to-violet-900 opacity-70 dark:opacity-50 transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-secondary-900/40 to-transparent" />
              </div>

              {/* Badges */}
              {isNearby && (
                <div className="absolute top-4 left-4">
                  <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-white uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                    <MapPin className="w-2 h-2" /> Nearby
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
                <div className="space-y-1">
                    <h3 className="font-black text-white text-xl uppercase leading-tight drop-shadow-xl group-hover:text-primary-400 transition-colors">
                        {venue.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                        <MapPin className="w-3 h-3 text-secondary-400" />
                        {venue.city}, {venue.state}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
