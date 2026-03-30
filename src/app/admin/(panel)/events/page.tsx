'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Plus, Users, Edit, Eye, AlertCircle, MapPin, 
  Loader2, Calendar, CheckCircle2, LayoutGrid, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminEvents } from '@/hooks/use-api/use-admin';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400',
    PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    COMPLETED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AdminEventsPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Queries
    const { data, isLoading, error } = useAdminEvents();
    const events = data?.events || [];

    if (session && (session.user as any)?.userType !== 'ADMIN') {
        router.push('/');
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-500">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                <p className="font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Retrieving platform events...</p>
            </div>
        );
    }

    const stats = {
        total: events.length,
        published: events.filter((e: any) => e.status === 'PUBLISHED').length,
        upcoming: events.filter((e: any) => e.status === 'PUBLISHED' && new Date(e.startDate) > new Date()).length,
        totalEnrollments: events.reduce((sum: number, e: any) => sum + (e._count?.enrollments || 0), 0),
    };

    return (
        <div className="space-y-10 pb-20 animate-in fade-in duration-700">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-secondary-50 dark:border-secondary-900/60 pb-10">
                <div>
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-primary-500/20 ring-4 ring-primary-500/10">
                            <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase leading-none mb-2">
                                Meeting <span className="text-primary italic">Hub</span>
                            </h1>
                            <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em]">Oversee platform gatherings and digital summits</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/venues"
                        className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-secondary-600 hover:bg-secondary-50 transition-all active:scale-95 shadow-sm"
                    >
                        <MapPin className="w-4 h-4 text-orange-500" /> Venues
                    </Link>
                    <Link
                        href="/admin/events/create"
                        className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-primary/20 border-b-4 border-primary-700"
                    >
                        <Plus className="w-4 h-4" /> Initialize Event
                    </Link>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Events', value: stats.total, icon: LayoutGrid, color: 'text-primary' },
                    { label: 'Live Events', value: stats.published, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-indigo-500' },
                    { label: 'Enrollments', value: stats.totalEnrollments, icon: Users, color: 'text-rose-500' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-2 border-secondary-50 dark:border-secondary-800 hover:border-primary/20 transition-all group overflow-hidden relative">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <s.icon className={cn("w-5 h-5", s.color)} />
                                <span className="text-[10px] font-black text-secondary-300 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <p className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                {s.value.toLocaleString()}
                            </p>
                        </div>
                        {/* Interior Decoration */}
                        <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br opacity-[0.03] group-hover:opacity-10 rounded-full transition-all duration-700", s.color.replace('text', 'bg'))} />
                    </div>
                ))}
            </div>

            {/* Event Matrix */}
            <div className="bg-white dark:bg-slate-900/50 rounded-[3rem] border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="px-10 py-8 border-b-2 border-secondary-50 dark:border-secondary-800 flex items-center justify-between bg-secondary-50/30">
                    <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none">
                        Active <span className="text-primary italic">Matrix</span>
                    </h2>
                    <div className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                        Records Sorted By Date
                    </div>
                </div>
                
                {events.length === 0 ? (
                    <div className="flex flex-col items-center gap-6 py-32 text-center">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center">
                            <AlertCircle className="w-10 h-10 text-secondary-200 dark:text-secondary-700" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter mb-2">Void State</p>
                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Initiate your first platform gathering.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-secondary-50 dark:divide-secondary-800">
                        {events.map((event: any) => (
                            <div key={event.id} className="group flex flex-col md:flex-row md:items-center gap-6 px-10 py-8 hover:bg-primary-50/30 dark:hover:bg-slate-800/50 transition-all duration-300">
                                {/* Cover Art */}
                                <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 shrink-0 border-4 border-white dark:border-secondary-800 shadow-lg group-hover:scale-105 transition-transform">
                                    {event.coverImage ? (
                                        <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/50">
                                            <Calendar className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Hub Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border",
                                            STATUS_COLORS[event.status || 'DRAFT']
                                        )}>
                                            {event.status}
                                        </span>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] opacity-80">
                                            {event.category?.icon ? `${event.category.icon} ` : ''}{event.category?.name || 'Uncategorized'}
                                        </span>
                                    </div>
                                    <p className="font-black text-xl text-secondary-900 dark:text-white uppercase tracking-tighter truncate leading-tight mb-2 group-hover:text-primary transition-colors">{event.title}</p>
                                    <div className="flex items-center gap-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            {format(new Date(event.startDate), 'MMM d, yyyy')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="tabular-nums">{event._count?.enrollments || 0} enrolled</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Strategic Actions */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <Link
                                        href={`/events/${event.slug}`}
                                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 flex items-center justify-center text-secondary-400 hover:text-primary hover:border-primary transition-all active:scale-90 shadow-sm"
                                        title="View Public Interface"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={`/admin/events/${event.id}/edit`}
                                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 flex items-center justify-center text-secondary-400 hover:text-indigo-500 hover:border-indigo-500 transition-all active:scale-90 shadow-sm"
                                        title="Modify Configuration"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <Link
                                        href={`/admin/events/${event.id}/enrollments`}
                                        className="flex items-center gap-3 px-6 py-3 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all active:scale-95 shadow-xl group/btn"
                                    >
                                        Inspect <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
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
