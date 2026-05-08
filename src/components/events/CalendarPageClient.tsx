'use client';

import dynamic from 'next/dynamic';

const CalendarView = dynamic(() => import('@/components/events/CalendarView'), {
    ssr: false,
    loading: () => (
        <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-white dark:bg-secondary-900 rounded-3xl md:rounded-[2.5rem] p-8 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    )
});

export default function CalendarPageClient() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <CalendarView />
        </div>
    );
}
