import { prisma } from '@/lib/prisma';
import CalendarView from '@/components/events/CalendarView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Event Calendar | Group Ad',
    description: 'Browse all upcoming events, meetings, and workshops in one place.',
};

export default async function EventsCalendarPage() {
    const events = await prisma.event.findMany({
        where: {
            status: 'PUBLISHED',
            visibility: 'PUBLIC',
        },
        select: {
            id: true,
            title: true,
            description: true,
            venue: true,
            isOnline: true,
            startDate: true,
            endDate: true,
            slug: true,
            coverImage: true,
            eventType: true,
        },
    });

    const formattedEvents = events.map((e) => ({
        id: e.id,
        title: e.title,
        start: new Date(e.startDate),
        end: new Date(e.endDate),
        resource: { ...e },
    }));

    return (
        <div className="max-w-screen-xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-secondary-900 dark:text-white">Event Calendar</h1>
                <p className="text-secondary-500 mt-1">
                    Explore all live meetings, webinars, and networking sessions in our community.
                </p>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <CalendarView events={formattedEvents} />
            </div>
        </div>
    );
}
