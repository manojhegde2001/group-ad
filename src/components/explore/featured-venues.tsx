'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface Venue {
  id: string;
  name: string;
  city: string;
  state: string;
}

const VENUE_IMAGES = [
    'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
    'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
    'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80',
    'https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800&q=80',
];

export function FeaturedVenues() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/venues')
      .then((r) => r.json())
      .then((d) => setVenues(d.venues?.slice(0, 4) || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
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
        {venues.map((venue, idx) => {
          const isNearby = (user as any)?.location?.toLowerCase().includes(venue.city.toLowerCase());
          const image = VENUE_IMAGES[idx % VENUE_IMAGES.length];
          
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
              {/* Image Header */}
              <div className="absolute inset-0 h-full w-full">
                <img 
                    src={image} 
                    alt={venue.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 dark:opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary-950 via-secondary-900/40 to-transparent" />
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
                 {isNearby && (
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-white uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                        <MapPin className="w-2 h-2" /> Nearby
                    </div>
                 )}
                 <div className="px-2 py-0.5 rounded-full bg-primary-500 text-[9px] font-black text-white uppercase tracking-tighter flex items-center gap-1 shadow-lg">
                    Featured
                 </div>
              </div>

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

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-white/40">
                    <div className="flex items-center gap-1 text-[9px] font-black uppercase">
                        <Users className="w-3 h-3" /> 2.4k Members
                    </div>
                    <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors">
                        Explore →
                    </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
