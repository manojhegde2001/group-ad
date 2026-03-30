'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Calendar, MapPin, Users, Search, Globe, Clock, Filter, ChevronRight, Video, Plus } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useCreateEvent } from '@/hooks/use-feed';
import { Button } from '@/components/ui/button';

import { useEvents } from '@/hooks/use-api/use-events';

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [upcoming, setUpcoming] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const { user } = useAuth();
  const { open: openCreateEvent } = useCreateEvent();

  const { data, isLoading } = useEvents({
    search,
    upcoming: upcoming ? 'true' : '',
    status: 'PUBLISHED',
  });

  const events: any[] = data?.events || [];

  if (user && user.userType !== 'ADMIN' && user.userType !== 'BUSINESS') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-secondary-100 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-secondary-400" />
        </div>
        <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-2">Events Restricted</h2>
        <p className="text-secondary-500 dark:text-secondary-400 max-w-sm mx-auto font-medium">
          The events feature is currently only available for Business and Admin accounts.
        </p>
        <Link 
          href="/" 
          className="mt-8 px-8 py-3 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20"
        >
          Return to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-600 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-semibold mb-2">
            <Calendar className="w-4 h-4" />
            Live Events & Meetups
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight">
            Find Events That Matter
          </h1>
          <p className="text-primary-100 text-lg max-w-xl mx-auto font-medium">
            Discover workshops, networking sessions, and exclusive meetups tailored to your community.
          </p>

          {/* Search */}
          <div className="max-w-lg mx-auto mt-6">
            <form
              onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search events..."
                  className="w-full bg-white text-secondary-900 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 ring-white/40"
                />
              </div>
              <button
                type="submit"
                className="bg-white text-primary-600 font-bold px-5 py-3 rounded-2xl hover:bg-primary-50 transition-colors text-sm"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 md:top-0 z-30 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border-b border-secondary-100 dark:border-secondary-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <Filter className="w-4 h-4 text-secondary-400 shrink-0" />
          <button
            onClick={() => setUpcoming(true)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
              upcoming
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setUpcoming(false)}
            className={cn(
              'px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all',
              !upcoming
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200'
            )}
          >
            All Events
          </button>
          <Link
            href="/events/calendar"
            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary-100 dark:bg-secondary-800 text-xs font-bold text-secondary-600 dark:text-secondary-400 hover:bg-secondary-200 transition-all whitespace-nowrap"
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar View
          </Link>

          {(user?.userType === 'ADMIN' || (user?.userType === 'BUSINESS' && (user as any)?.verificationStatus === 'VERIFIED')) && (
            <Button
              onClick={openCreateEvent}
              variant="solid"
              color="primary"
              rounded="pill"
              size="sm"
              className="ml-2 font-bold shadow-lg shadow-primary-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create Event
            </Button>
          )}
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-secondary-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-secondary-700 dark:text-secondary-300">No events found</h3>
            <p className="text-secondary-500 text-sm mt-1">
              {search ? `No events matching "${search}"` : 'No upcoming events at the moment.'}
            </p>
            {search && (
              <button
                onClick={() => { setSearch(''); setSearchInput(''); }}
                className="mt-4 text-primary-500 text-sm font-semibold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  const startDate = new Date(event.startDate);
  const ended = isPast(new Date(event.endDate));

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block bg-white dark:bg-secondary-900 rounded-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800 hover:shadow-lg hover:shadow-primary-500/5 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover image or gradient */}
      <div className={cn(
        'h-36 relative overflow-hidden',
        !event.coverImage && 'bg-gradient-to-br from-primary-400 via-primary-500 to-indigo-600'
      )}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {event.isOnline && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Video className="w-2.5 h-2.5" /> Online
            </span>
          )}
          {ended && (
            <span className="inline-flex items-center bg-secondary-700/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Ended
            </span>
          )}
        </div>

        {/* Date badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center shadow">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest leading-none">{format(startDate, 'MMM')}</p>
          <p className="text-lg font-black text-secondary-900 leading-tight">{format(startDate, 'd')}</p>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-secondary-900 dark:text-white text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {event.title}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-secondary-500">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>{format(startDate, 'h:mm a')} · {format(startDate, 'EEE, MMM d yyyy')}</span>
          </div>

          {!event.isOnline && (event.city || event.venue) && (
            <div className="flex items-center gap-1.5 text-xs text-secondary-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.venue || event.city}{event.state ? `, ${event.state}` : ''}</span>
            </div>
          )}

          {event.isOnline && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Online Event</span>
            </div>
          )}

          {event._count?.enrollments !== undefined && (
            <div className="flex items-center gap-1.5 text-xs text-secondary-500">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>
                {event._count.enrollments} enrolled
                {event.maxAttendees ? ` / ${event.maxAttendees} max` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-50 dark:border-secondary-800">
          {event.organizer && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900 overflow-hidden shrink-0">
                {event.organizer.avatar ? (
                  <img src={event.organizer.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="flex items-center justify-center h-full text-[9px] font-bold text-primary-600">
                    {event.organizer.name?.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-secondary-500 font-medium truncate max-w-[100px]">{event.organizer.name}</span>
            </div>
          )}
          <span className="flex items-center gap-0.5 text-[10px] font-bold text-primary-600 group-hover:gap-1 transition-all">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
