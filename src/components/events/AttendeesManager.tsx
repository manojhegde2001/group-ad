'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Users, Search, CheckCircle2, XCircle, Clock, Check, X, 
    UserCheck, UserX, Loader2, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { eventService } from '@/services/api/events';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';

interface AttendeesManagerProps {
    eventId: string;
}

export default function AttendeesManager({ eventId }: AttendeesManagerProps) {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'ATTENDED'>('ALL');

    // Fetch enrollments
    const { data, isLoading, refetch } = useQuery<any>({
        queryKey: ['event-enrollments', eventId],
        queryFn: () => eventService.getEventEnrollments(eventId),
        enabled: !!eventId
    });

    const enrollments = data?.enrollments || [];

    // Approve/Reject enrollment mutation
    const updateStatusMutation = useMutation({
        mutationFn: ({ userId, action }: { userId: string; action: 'APPROVE' | 'REJECT' }) => 
            apiClient.patch(`/api/events/${eventId}/enrollments/${userId}`, { action }),
        onSuccess: (_, variables) => {
            toast.success(`Registration ${variables.action === 'APPROVE' ? 'approved' : 'rejected'} successfully!`);
            refetch();
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
            queryClient.invalidateQueries({ queryKey: ['events'] });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update registration status');
        }
    });

    // Toggle manual attendance mutation
    const updateAttendanceMutation = useMutation({
        mutationFn: (attendedUserIds: string[]) => 
            apiClient.post(`/api/events/${eventId}/attendance`, { attendedUserIds }),
        onSuccess: () => {
            toast.success('Attendance records synchronized.');
            refetch();
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update attendance');
        }
    });

    const handleToggleAttendance = (userId: string, currentlyAttended: boolean) => {
        // Collect all currently checked-in user IDs (from APPROVED enrollments)
        const approvedEnrollments = enrollments.filter((e: any) => e.status === 'APPROVED');
        let attendedIds = approvedEnrollments
            .filter((e: any) => e.attended)
            .map((e: any) => e.userId);

        if (currentlyAttended) {
            // Remove user
            attendedIds = attendedIds.filter((id: string) => id !== userId);
        } else {
            // Add user
            attendedIds = [...attendedIds, userId];
        }

        updateAttendanceMutation.mutate(attendedIds);
    };

    // Filters & Searches
    const filteredEnrollments = enrollments.filter((e: any) => {
        const nameMatch = e.user.name.toLowerCase().includes(search.toLowerCase()) || 
                          e.user.username.toLowerCase().includes(search.toLowerCase());
        
        if (!nameMatch) return false;

        if (activeFilter === 'PENDING') return e.status === 'PENDING';
        if (activeFilter === 'APPROVED') return e.status === 'APPROVED' && !e.attended;
        if (activeFilter === 'ATTENDED') return e.status === 'APPROVED' && e.attended;
        return true;
    });

    const counts = {
        ALL: enrollments.length,
        PENDING: enrollments.filter((e: any) => e.status === 'PENDING').length,
        APPROVED: enrollments.filter((e: any) => e.status === 'APPROVED' && !e.attended).length,
        ATTENDED: enrollments.filter((e: any) => e.status === 'APPROVED' && e.attended).length,
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 p-8 rounded-3xl flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-xs font-black uppercase text-secondary-400 tracking-wider">Loading Attendees Manager...</p>
            </div>
        );
    }

    return (
        <section className="bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-secondary-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-500" /> Attendees Manager
                    </h2>
                    <p className="text-xs text-secondary-400 font-semibold mt-1">Review applications, waitlists, and record attendance manually.</p>
                </div>
                <Button 
                    onClick={() => refetch()} 
                    variant="outline" 
                    className="rounded-xl gap-2 font-bold text-xs uppercase self-start sm:self-auto border-secondary-200"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh List
                </Button>
            </div>

            {/* Metrics & Filter Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-secondary-50 dark:bg-secondary-950 rounded-2xl">
                {(['ALL', 'PENDING', 'APPROVED', 'ATTENDED'] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`flex-1 min-w-[80px] py-2 px-3 text-center text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                            activeFilter === filter 
                                ? 'bg-white dark:bg-secondary-900 text-primary-600 dark:text-white shadow-sm' 
                                : 'text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200'
                        }`}
                    >
                        {filter === 'ALL' && 'All'}
                        {filter === 'PENDING' && 'Waitlist'}
                        {filter === 'APPROVED' && 'Approved'}
                        {filter === 'ATTENDED' && 'Attended'}
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                            activeFilter === filter
                                ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300'
                                : 'bg-secondary-200 dark:bg-secondary-800 text-secondary-500'
                        }`}>
                            {counts[filter]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search enrollees by name or username..."
                    className="w-full bg-secondary-50 dark:bg-secondary-950 rounded-2xl pl-11 pr-4 py-3 text-xs outline-none border border-secondary-100 dark:border-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
            </div>

            {/* Attendees Grid List */}
            <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-secondary-200">
                {filteredEnrollments.length === 0 ? (
                    <div className="text-center py-12 text-secondary-400 border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-2xl flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 opacity-30" />
                        <span className="text-xs uppercase font-black tracking-wider">No enrollees found</span>
                    </div>
                ) : (
                    filteredEnrollments.map((enrollment: any) => {
                        const contact = enrollment.user;
                        const status = enrollment.status;
                        const attended = enrollment.attended;

                        return (
                            <div 
                                key={enrollment.id}
                                className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border border-secondary-50 dark:border-secondary-800 bg-secondary-50/20 dark:bg-secondary-950/20 gap-4"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar 
                                        src={contact.avatar || undefined} 
                                        name={contact.name} 
                                        size="md" 
                                    />
                                    <div className="text-left min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-xs font-black text-secondary-900 dark:text-white truncate">{contact.name}</p>
                                            
                                            {/* Status Badge */}
                                            {status === 'PENDING' && (
                                                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <Clock className="w-2 h-2" /> Waitlist
                                                </span>
                                            )}
                                            {status === 'APPROVED' && !attended && (
                                                <span className="px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 className="w-2 h-2" /> Approved
                                                </span>
                                            )}
                                            {status === 'APPROVED' && attended && (
                                                <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <UserCheck className="w-2 h-2" /> Attended
                                                </span>
                                            )}
                                            {status === 'REJECTED' && (
                                                <span className="px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                    <XCircle className="w-2 h-2" /> Rejected
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-secondary-400 font-bold uppercase truncate mt-0.5">
                                            @{contact.username} · {contact.companyName || 'Individual'} · {contact.userType}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions Panels */}
                                <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                                    {status === 'PENDING' && (
                                        <div className="flex gap-2 w-full md:w-auto">
                                            <Button
                                                onClick={() => updateStatusMutation.mutate({ userId: contact.id, action: 'APPROVE' })}
                                                disabled={updateStatusMutation.isPending}
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 md:flex-initial rounded-xl text-[10px] font-black uppercase tracking-wider border-green-200 text-green-600 hover:bg-green-50"
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                onClick={() => updateStatusMutation.mutate({ userId: contact.id, action: 'REJECT' })}
                                                disabled={updateStatusMutation.isPending}
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 md:flex-initial rounded-xl text-[10px] font-black uppercase tracking-wider border-red-200 text-red-600 hover:bg-red-50"
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}

                                    {status === 'APPROVED' && (
                                        <Button
                                            onClick={() => handleToggleAttendance(contact.id, attended)}
                                            disabled={updateAttendanceMutation.isPending}
                                            size="sm"
                                            variant={attended ? "outline" : "solid"}
                                            color={attended ? "secondary" : "primary"}
                                            className="w-full md:w-auto rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1"
                                        >
                                            {updateAttendanceMutation.isPending ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : attended ? (
                                                <>
                                                    <UserX className="w-3.5 h-3.5 mr-1" /> Mark Absent
                                                </>
                                            ) : (
                                                <>
                                                    <UserCheck className="w-3.5 h-3.5 mr-1" /> Check In
                                                </>
                                            )}
                                        </Button>
                                    )}

                                    {status === 'REJECTED' && (
                                        <Button
                                            onClick={() => updateStatusMutation.mutate({ userId: contact.id, action: 'APPROVE' })}
                                            disabled={updateStatusMutation.isPending}
                                            size="sm"
                                            variant="text"
                                            className="text-[10px] font-black uppercase text-primary-500 hover:underline"
                                        >
                                            Restore
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </section>
    );
}
