import { redirect } from 'next/navigation';

// The calendar is now a view inside /events rather than a nested route.
export default function EventsCalendarPage() {
    redirect('/events?view=calendar');
}
