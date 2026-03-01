import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Users, Edit, Eye, AlertCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400',
    PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default async function AdminEventsPage() {
    const events = await prisma.event.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            category: { select: { name: true, icon: true } },
            _count: { select: { enrollments: true } },
        },
    });

    const stats = {
        total: events.length,
        published: events.filter((e) => e.status === 'PUBLISHED').length,
        upcoming: events.filter((e) => e.status === 'PUBLISHED' && e.startDate > new Date()).length,
        totalEnrollments: events.reduce((sum, e) => sum + e._count.enrollments, 0),
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Events Dashboard</h1>
                    <p className="text-sm text-secondary-500 mt-0.5">Manage all meetings and events</p>
                </div>
                <Link
                    href="/admin/events/create"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> New Event
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Events', value: stats.total },
                    { label: 'Published', value: stats.published },
                    { label: 'Upcoming', value: stats.upcoming },
                    { label: 'Total Enrollments', value: stats.totalEnrollments },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-secondary-900 rounded-2xl p-4 border border-secondary-100 dark:border-secondary-800">
                        <p className="text-2xl font-bold text-secondary-900 dark:text-white">{s.value}</p>
                        <p className="text-xs text-secondary-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Events table */}
            <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-secondary-100 dark:border-secondary-800">
                    <h2 className="font-semibold text-secondary-800 dark:text-white">All Events</h2>
                </div>
                {events.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-secondary-400">
                        <AlertCircle className="w-8 h-8" />
                        <p className="text-sm">No events yet. Create your first event!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
                        {events.map((event) => (
                            <div key={event.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                                {/* Cover */}
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 shrink-0">
                                    {event.coverImage && (
                                        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{event.title}</p>
                                    <p className="text-xs text-secondary-500 mt-0.5">
                                        {format(event.startDate, 'MMM d, yyyy')} · {event.category ? `${event.category.icon ?? ''} ${event.category.name}` : 'No category'}
                                    </p>
                                </div>

                                {/* Status */}
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[event.status]}`}>
                                    {event.status}
                                </span>

                                {/* Enrollments */}
                                <div className="flex items-center gap-1 text-xs text-secondary-500 shrink-0">
                                    <Users className="w-3.5 h-3.5" />
                                    <span>{event._count.enrollments}{event.maxAttendees ? `/${event.maxAttendees}` : ''}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <Link
                                        href={`/events/${event.slug}`}
                                        className="p-2 rounded-lg text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        title="View public page"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/admin/events/${event.id}/edit`}
                                        className="p-2 rounded-lg text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        title="Edit event"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href={`/admin/events/${event.id}/enrollments`}
                                        className="p-2 rounded-lg text-secondary-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                        title="Manage enrollments"
                                    >
                                        <Users className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
