'use client';

import dynamic from 'next/dynamic';

const EventsCalendar = dynamic(() => import('@/components/events/EventsCalendar'), {
    ssr: false,
    loading: () => (
        <div className="h-[60vh] min-h-[420px] bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

export default function CalendarPageClient({ events = [] }: { events?: any[] }) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EventsCalendar events={events} />
        </div>
    );
}
