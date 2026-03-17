import CalendarView from '@/components/events/CalendarView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Event Calendar | Group Ad',
    description: 'Browse all upcoming events, meetings, and workshops in one place.',
};

export default function EventsCalendarPage() {
    return (
        <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-4 md:pt-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white leading-tight">Event Calendar</h1>
                <p className="text-secondary-500 mt-0.5 font-medium text-sm">
                    Explore all live meetings, webinars, and networking sessions in our community.
                </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
                <CalendarView />
            </div>
        </div>
    );
}
