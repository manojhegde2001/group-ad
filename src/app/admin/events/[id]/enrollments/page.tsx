'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Users, Mail, Briefcase } from 'lucide-react';
import { BulkEventActions } from '@/components/admin/BulkEventActions';

type Enrollment = {
    id: string;
    status: string;
    createdAt: string;
    attended: boolean;
    attendedAt: string | null;
    user: {
        id: string; name: string; username: string; avatar?: string;
        email: string; userType: string; industry?: string; companyName?: string;
    };
};

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    APPROVED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    REJECTED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    CANCELLED: 'bg-secondary-100 text-secondary-500',
};

export default function AdminEnrollmentsPage() {
    const { id: eventId } = useParams<{ id: string }>();
    const [event, setEvent] = useState<{ id: string; title: string; endDate: string } | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    
    // Attendance state
    const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
    const [savingAttendance, setSavingAttendance] = useState(false);

    const fetchEnrollments = async () => {
        try {
            const res = await fetch(`/api/events/${eventId}/enrollments`);
            const data = await res.json();
            if (res.ok) {
                setEvent(data.event);
                setEnrollments(data.enrollments);
                
                // Pre-select users who already attended
                const attendedIds = data.enrollments
                    .filter((e: Enrollment) => e.attended && e.status === 'APPROVED')
                    .map((e: Enrollment) => e.user.id);
                setSelectedAttendees(new Set(attendedIds));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEnrollments(); }, [eventId]);

    const handleAction = async (userId: string, action: 'APPROVE' | 'REJECT') => {
        setActionLoading(userId + action);
        try {
            const res = await fetch(`/api/events/${eventId}/enrollments/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(`Enrollment ${action.toLowerCase()}d!`);
            setEnrollments((prev) =>
                prev.map((e) => e.user.id === userId ? { ...e, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : e)
            );
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const toggleAttendance = (userId: string) => {
        setSelectedAttendees(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    const saveAttendance = async () => {
        setSavingAttendance(true);
        try {
            const res = await fetch(`/api/events/${eventId}/attendance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attendedUserIds: Array.from(selectedAttendees) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            
            toast.success('Attendance saved and notifications sent!');
            
            // Re-fetch to get updated attended status/timestamps
            fetchEnrollments();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSavingAttendance(false);
        }
    };

    const isEventEnded = event && new Date(event.endDate) < new Date();

    const stats = {
        total: enrollments.length,
        pending: enrollments.filter((e) => e.status === 'PENDING').length,
        approved: enrollments.filter((e) => e.status === 'APPROVED').length,
        rejected: enrollments.filter((e) => e.status === 'REJECTED').length,
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">Enrollment Management</h1>
                <p className="text-sm text-secondary-500 mt-0.5">Approve or reject attendees for this event</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Total', value: stats.total, color: 'text-secondary-700' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
                    { label: 'Approved', value: stats.approved, color: 'text-green-600' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-500' },
                ].map((s) => (
                    <div key={s.label} className="bg-white dark:bg-secondary-900 rounded-2xl p-4 border border-secondary-100 dark:border-secondary-800">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-secondary-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Bulk Actions */}
            <BulkEventActions 
                eventId={eventId} 
                onSuccess={fetchEnrollments} 
                isEventEnded={!!isEventEnded} 
            />

            {/* Enrollments list */}
            <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-secondary-100 dark:border-secondary-800">
                    <h2 className="font-semibold text-secondary-800 dark:text-white">Enrollees</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-secondary-400 text-sm">Loading...</div>
                ) : enrollments.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-16 text-secondary-400">
                        <Users className="w-8 h-8" />
                        <p className="text-sm">No enrollments yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-secondary-100 dark:divide-secondary-800">
                        {enrollments.map((enrollment) => (
                            <div key={enrollment.id} className={`flex items-center gap-4 px-5 py-4 ${isEventEnded && enrollment.status === 'APPROVED' ? 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors' : ''}`}>
                                
                                {/* Checkbox for attendance marking */}
                                {isEventEnded && enrollment.status === 'APPROVED' && (
                                    <div className="flex items-center justify-center shrink-0 pr-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedAttendees.has(enrollment.user.id)}
                                            onChange={() => toggleAttendance(enrollment.user.id)}
                                            className="w-5 h-5 rounded border-secondary-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                        />
                                    </div>
                                )}

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden shrink-0">
                                    {enrollment.user.avatar
                                        ? <img src={enrollment.user.avatar} alt={enrollment.user.name} className="w-full h-full object-cover" />
                                        : <span className="text-white text-sm font-bold">{enrollment.user.name.charAt(0)}</span>
                                    }
                                </div>

                                {/* User info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm text-secondary-900 dark:text-white truncate">{enrollment.user.name}</p>
                                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-500 rounded-full shrink-0">
                                            {enrollment.user.userType}
                                        </span>
                                    </div>
                                    <p className="text-xs text-secondary-500 flex items-center gap-1 mt-0.5">
                                        <Mail className="w-3 h-3" />
                                        {enrollment.user.email}
                                    </p>
                                    {enrollment.user.companyName && (
                                        <p className="text-xs text-secondary-400 flex items-center gap-1">
                                            <Briefcase className="w-3 h-3" />
                                            {enrollment.user.companyName} {enrollment.user.industry ? `· ${enrollment.user.industry}` : ''}
                                        </p>
                                    )}
                                </div>

                                {/* Enrolled date */}
                                <p className="text-xs text-secondary-400 shrink-0 hidden md:block">
                                    {new Date(enrollment.createdAt).toLocaleDateString()}
                                </p>

                                {/* Status badge */}
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLES[enrollment.status] ?? ''}`}>
                                    {enrollment.status}
                                </span>

                                {/* Actions */}
                                {enrollment.status === 'PENDING' && (
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={() => handleAction(enrollment.user.id, 'APPROVE')}
                                            disabled={actionLoading === enrollment.user.id + 'APPROVE'}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-semibold hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50 transition-colors"
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {actionLoading === enrollment.user.id + 'APPROVE' ? '...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(enrollment.user.id, 'REJECT')}
                                            disabled={actionLoading === enrollment.user.id + 'REJECT'}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-lg text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-3.5 h-3.5" />
                                            {actionLoading === enrollment.user.id + 'REJECT' ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                )}
                                {enrollment.status !== 'PENDING' && (
                                    <div className="w-[104px] shrink-0">
                                        {enrollment.attended && (
                                            <span className="flex justify-end items-center text-xs text-green-600 dark:text-green-400 font-medium">
                                                <CheckCircle className="w-4 h-4 mr-1" /> Attended
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Save Attendance Banner */}
            {isEventEnded && status === 'authenticated' && (
                <div className="mt-8 bg-white dark:bg-secondary-900 border border-primary-200 dark:border-primary-900/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg text-secondary-900 dark:text-white">Mark Attendance</h3>
                            <p className="text-secondary-500 text-sm mt-1">This event has ended. Select the attendees who were present and save to notify them.</p>
                        </div>
                        <button
                            onClick={saveAttendance}
                            disabled={savingAttendance}
                            className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {savingAttendance ? 'Saving...' : 'Save Attendance'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
