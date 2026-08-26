'use client';

import { useState } from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Plus, Users, Edit, Eye, MapPin,
  Loader2, Calendar, CheckCircle2, LayoutGrid, ArrowRight,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminEvents } from '@/hooks/use-api/use-admin';
import { AppImage } from '@/components/ui/app-image';
import { DataGrid, DataGridPagination, DataGridToolbar, DataGridColumn, DataGridAction } from '@/components/ui/data-grid';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [limit, setLimit] = useState(20);
    const { data, isLoading, error } = useAdminEvents({
        page,
        limit,
        search: searchTerm || undefined,
        all: true
    });
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

    const columns: DataGridColumn<any>[] = [
        {
            key: 'title',
            header: 'Event',
            sortable: true,
            render: (event) => (
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 shrink-0 relative">
                        {event.coverImage ? (
                            <AppImage src={event.coverImage} alt={event.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/50">
                                <Calendar className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                                STATUS_COLORS[event.status || 'DRAFT']
                            )}>
                                {event.status}
                            </span>
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wide opacity-80">
                                {event.category?.name || 'Uncategorized'}
                            </span>
                        </div>
                        <p className="font-bold text-sm text-secondary-900 dark:text-white uppercase tracking-tight truncate leading-tight mb-1">{event.title}</p>
                        <div className="flex items-center gap-3 text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-primary" />
                                {format(new Date(event.startDate), 'MMM d, yyyy')}
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-emerald-500" />
                                <span className="tabular-nums">{event._count?.enrollments || 0} enrolled</span>
                            </div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const actions: DataGridAction<any>[] = [
        {
            key: 'view',
            icon: Eye,
            variant: 'default',
            title: 'View Public Interface',
            href: (event) => `/events/${event.slug}`,
        },
        {
            key: 'edit',
            icon: Edit,
            variant: 'default',
            title: 'Modify Configuration',
            href: (event) => `/admin/events/${event.id}/edit`,
        },
        {
            key: 'inspect',
            icon: ArrowRight,
            label: 'Inspect',
            variant: 'default',
            href: (event) => `/admin/events/${event.id}/enrollments`,
        },
    ];

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-700">

            <AdminPageHeader
                icon={Calendar}
                title="Meeting"
                accent="Hub"
                description="Oversee platform gatherings and digital summits"
                actions={
                    <>
                        <Link
                            href="/admin/venues"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-secondary-600 hover:bg-secondary-50 transition-all active:scale-95 shadow-sm"
                        >
                            <MapPin className="w-4 h-4 text-orange-500" /> Venues
                        </Link>
                        <Link
                            href="/admin/events/create"
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <Plus className="w-4 h-4" /> Initialize Event
                        </Link>
                    </>
                }
            />

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Total Events', value: stats.total, icon: LayoutGrid, color: 'text-primary' },
                    { label: 'Live Events', value: stats.published, icon: CheckCircle2, color: 'text-emerald-500' },
                    { label: 'Upcoming', value: stats.upcoming, icon: Calendar, color: 'text-indigo-500' },
                    { label: 'Enrollments', value: stats.totalEnrollments, icon: Users, color: 'text-rose-500' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-secondary-100 dark:border-secondary-800 hover:border-primary/20 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <s.icon className={cn("w-4 h-4", s.color)} />
                            <span className="text-[9px] font-black text-secondary-300 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <p className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight tabular-nums leading-none">
                            {s.value.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>

            <DataGridToolbar
                search={
                    <div className="flex items-center gap-3 bg-secondary-50/50 dark:bg-slate-900 px-3 py-2 rounded-lg ring-1 ring-secondary-100 dark:ring-secondary-800">
                        <Search className="w-4 h-4 text-secondary-300 shrink-0" />
                        <input
                            placeholder="Find meeting by title..."
                            className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase tracking-tight text-secondary-900 dark:text-white placeholder:text-secondary-300"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                }
            />

            <DataGrid
                columns={columns}
                data={events}
                emptyMessage="Initiate your first platform gathering"
                getRowId={(event) => event.id}
                actions={actions}
                footer={
                    data?.pagination && (
                        <DataGridPagination
                            page={page}
                            totalPages={data.pagination.totalPages}
                            total={data.pagination.total}
                            pageSize={limit}
                            onPageChange={setPage}
                            onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
                            itemLabel="events"
                        />
                    )
                }
            />
        </div>
    );
}
