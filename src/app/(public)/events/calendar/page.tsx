import CalendarPageClient from '@/components/events/CalendarPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Event Calendar | Vrutta',
    description: 'Browse all upcoming events, meetings, and workshops in one place.',
    openGraph: {
        title: 'Event Calendar | Vrutta',
        description: 'Browse all upcoming events, meetings, and workshops in one place.',
        images: [
            {
                url: 'https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1',
                width: 1200,
                height: 630,
                alt: 'Event Calendar',
            }
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Event Calendar | Vrutta',
        description: 'Browse all upcoming events, meetings, and workshops in one place.',
        images: ['https://drive.google.com/uc?export=download&id=1C8sCXdXsuwVadNbQJ1ycoBBa84okc9A1'],
    },
};

export default function EventsCalendarPage() {
    return (
        <div className="max-w-screen-2xl mx-auto px-4 pt-4 pb-4 md:pt-6">
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white leading-tight">Event Calendar</h1>
                <p className="text-secondary-500 mt-0.5 font-medium text-sm">
                    Explore all live meetings, webinars, and collaboration sessions in our community.
                </p>
            </div>

            <CalendarPageClient />
        </div>
    );
}
