'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Users, Search, Globe, Clock, Video, Plus, X, Loader2, ChevronRight } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useCreateEvent } from '@/hooks/use-feed';
import { Button } from '@/components/ui/button';
import { AppImage } from '@/components/ui/app-image';
import CalendarPageClient from '@/components/events/CalendarPageClient';
import EventSheet from '@/components/events/EventSheet';

import { useEvents, useInfiniteEvents, useMyEvents } from '@/hooks/use-api/use-events';

type Tab = 'upcoming' | 'calendar' | 'my' | 'attended';

const TABS: { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'calendar', label: 'Calendar' },
  { key: 'my', label: 'My Events' },
  { key: 'attended', label: 'Attended' },
];

function EventsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { open: openCreateEvent } = useCreateEvent();

  const [tab, setTab] = useState<Tab>(searchParams.get('view') === 'calendar' ? 'calendar' : 'upcoming');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Live search: filter as you type, no need to press Enter. A short debounce
  // avoids firing a request on every keystroke; Enter (form submit) still
  // applies immediately for anyone who does press it.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const changeTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (next === 'calendar') params.set('view', 'calendar');
    else params.delete('view');
    const qs = params.toString();
    router.replace(qs ? `/events?${qs}` : '/events', { scroll: false });
  };

  // Upcoming: paginated "load more" browsing — the API caps a single page at
  // 12 events, so without this a user could never see past the first page.
  const {
    data: upcomingPages,
    isLoading: loadingUpcoming,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteEvents(
    { search, location: search, upcoming: 'true', status: 'PUBLISHED' },
    { enabled: tab === 'upcoming' }
  );
  // Calendar needs its whole working set in memory to bucket by day/month, so
  // it gets one larger single-shot fetch instead of pagination.
  const { data: calendarData, isLoading: loadingCalendar } = useEvents(
    { search, location: search, status: 'PUBLISHED', limit: 100 },
    { enabled: tab === 'calendar' }
  );
  const { data: myData, isLoading: loadingMy } = useMyEvents();
  const myCount = myData?.enrollments?.length ?? 0;
  const attendedCount = myData?.enrollments?.filter((en: any) => en.attended).length ?? 0;
  const tabCounts: Partial<Record<Tab, number>> = { my: myCount, attended: attendedCount };

  const isLoading =
    tab === 'my' || tab === 'attended' ? loadingMy : tab === 'calendar' ? loadingCalendar : loadingUpcoming;

  const matchesSearch = (e: any) => e.title?.toLowerCase().includes(search.toLowerCase());

  let events: any[] = [];
  if (tab === 'my') {
    events = (myData?.enrollments || [])
      .map((en: any) => ({ ...en.event, enrollmentStatus: en.status, isEnrolled: true, attended: en.attended }))
      .filter(matchesSearch);
  } else if (tab === 'attended') {
    events = (myData?.enrollments || [])
      .filter((en: any) => en.attended)
      .map((en: any) => ({ ...en.event, enrollmentStatus: en.status, isEnrolled: true, attended: en.attended }))
      .filter(matchesSearch);
  } else if (tab === 'calendar') {
    events = calendarData?.events || [];
  } else {
    events = upcomingPages?.pages.flatMap((p: any) => p.events) || [];
  }

  const [sheetId, setSheetId] = useState<string | null>(null);
  const sheetEvent = sheetId ? events.find((e: any) => e.id === sheetId) ?? null : null;

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

  const isAdmin = (user as any)?.userType === 'ADMIN';

  return (
    <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950">
      {/* Header — `top-0`, not `md:top-20`: the app shell's <main> is `overflow-x-hidden`
          (a scroll container), so this header sticks to the top of <main>, which already
          begins right below the navbar. Adding the navbar height again (`md:top-20`) is
          what pushed it 80px down on desktop. */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-secondary-950/95 backdrop-blur-xl border-b border-secondary-100 dark:border-secondary-800 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {/* Row 1 — title + create + search */}
          <div className="flex items-center gap-3 pt-3 pb-2.5">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-secondary-900 dark:text-white shrink-0">Events</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(searchInput.trim());
              }}
              className="relative flex-1 min-w-0 max-w-md"
            >
              {searchInput && (searchInput !== search || isLoading) ? (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              )}
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search events, city…"
                aria-label="Search events"
                className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-900 dark:text-white rounded-xl pl-9 pr-9 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400"
              />
              {searchInput && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-secondary-400 hover:bg-secondary-200 dark:hover:bg-secondary-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </form>
            {isAdmin && (
              <Button
                onClick={openCreateEvent}
                variant="solid"
                color="primary"
                rounded="pill"
                size="sm"
                className="font-bold shadow-lg shadow-primary-500/20 shrink-0 ml-auto"
              >
                <Plus className="w-4 h-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            )}
          </div>

          {/* Row 2 — underline tabs; the 2px active bar sits on the header's own bottom border */}
          <nav
            aria-label="Event views"
            className="flex items-center gap-6 overflow-x-auto scrollbar-hide"
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              const count = tabCounts[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => changeTab(t.key)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'shrink-0 -mb-px flex items-center gap-1.5 border-b-2 pt-0.5 pb-2.5 text-sm font-bold whitespace-nowrap transition-colors',
                    active
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-secondary-500 hover:text-secondary-800 dark:hover:text-secondary-300'
                  )}
                >
                  {t.label}
                  {!!count && (
                    <span
                      className={cn(
                        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black',
                        active
                          ? 'bg-primary-500 text-white'
                          : 'bg-secondary-200 dark:bg-secondary-700 text-secondary-600 dark:text-secondary-300'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-5 pb-6">
        {tab === 'calendar' ? (
          isLoading ? (
            <div className="h-[60vh] min-h-[420px] bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <CalendarPageClient events={events} />
          )
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-secondary-200 dark:text-secondary-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-secondary-700 dark:text-secondary-300">
              {tab === 'my'
                ? "You haven't registered for any events yet"
                : tab === 'attended'
                  ? 'No attended events yet'
                  : 'No events found'}
            </h3>
            <p className="text-secondary-500 text-sm mt-1">
              {search ? 'Try a different search.' : 'Check back soon for new events.'}
            </p>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSearchInput('');
                }}
                className="mt-4 text-primary-500 text-sm font-semibold hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {events.map((event) => (
                <EventCard key={event.id} event={event} onQuickView={setSheetId} />
              ))}
            </div>
            {tab === 'upcoming' && hasNextPage && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-6 py-2.5 rounded-full text-sm font-bold bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors disabled:opacity-60"
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more events'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <EventSheet event={sheetEvent} onClose={() => setSheetId(null)} />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EventsView />
    </Suspense>
  );
}

function EventCard({ event, onQuickView }: { event: any; onQuickView: (id: string) => void }) {
  const startDate = new Date(event.startDate);
  const ended = isPast(new Date(event.endDate));
  const cancelled = event.status === 'CANCELLED';
  const seatsLeft: number | null = event.seatsLeft ?? null;
  const actionable = !cancelled && !ended;
  const quickViewLabel =
    event.enrollmentStatus === 'APPROVED'
      ? "You're going · Manage"
      : event.enrollmentStatus === 'PENDING'
        ? 'On the waitlist · Manage'
        : 'Quick reserve';

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex flex-col bg-white dark:bg-secondary-900 rounded-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-xl hover:shadow-primary-500/5 hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Cover image or gradient */}
      <div
        className={cn(
          'h-40 relative overflow-hidden',
          !event.coverImage && 'bg-gradient-to-br from-primary-400 via-primary-500 to-indigo-600'
        )}
      >
        {event.coverImage ? (
          <AppImage
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="w-16 h-16 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
          {event.isOnline && (
            <span className="inline-flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              <Video className="w-2.5 h-2.5" /> Online
            </span>
          )}
          {cancelled ? (
            <span className="inline-flex items-center bg-red-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Cancelled
            </span>
          ) : ended && (
            <span className="inline-flex items-center bg-secondary-700/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Ended
            </span>
          )}
          {event.enrollmentStatus === 'APPROVED' && !event.attended && (
            <span className="inline-flex items-center bg-green-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Going
            </span>
          )}
          {event.enrollmentStatus === 'PENDING' && (
            <span className="inline-flex items-center bg-amber-500/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Waitlist
            </span>
          )}
          {event.attended && (
            <span className="inline-flex items-center bg-indigo-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              ✓ Attended
            </span>
          )}
        </div>

        {/* Date badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1.5 text-center shadow">
          <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest leading-none">{format(startDate, 'MMM')}</p>
          <p className="text-lg font-black text-secondary-900 leading-tight">{format(startDate, 'd')}</p>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col">
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

          {!ended && !cancelled && seatsLeft != null && seatsLeft <= 5 && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold',
                seatsLeft <= 0 ? 'text-secondary-400' : 'text-amber-600 dark:text-amber-500'
              )}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{seatsLeft <= 0 ? 'Fully booked' : `Only ${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left`}</span>
            </div>
          )}
        </div>

        {actionable && (
          <div
            role="button"
            tabIndex={0}
            aria-label={`${quickViewLabel} — ${event.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(event.id);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onQuickView(event.id);
              }
            }}
            className="mt-3 pt-3 border-t border-secondary-50 dark:border-secondary-800 flex items-center justify-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer"
          >
            {quickViewLabel} <ChevronRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </Link>
  );
}
