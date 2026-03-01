import { format } from 'date-fns';

export function isAdmin(userType: string) {
    return userType === 'ADMIN';
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).slice(2, 7);
}

export function formatEventDate(startDate: Date, endDate: Date): string {
    const sameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');
    if (sameDay) {
        return `${format(startDate, 'EEEE, MMMM d, yyyy')} · ${format(startDate, 'h:mm a')} – ${format(endDate, 'h:mm a')}`;
    }
    return `${format(startDate, 'MMMM d')} – ${format(endDate, 'MMMM d, yyyy')}`;
}

export function getEventStatus(event: { startDate: Date; endDate: Date; status: string }): 'upcoming' | 'ongoing' | 'past' | 'cancelled' {
    if (event.status === 'CANCELLED') return 'cancelled';
    const now = new Date();
    if (event.endDate < now) return 'past';
    if (event.startDate <= now && event.endDate >= now) return 'ongoing';
    return 'upcoming';
}
