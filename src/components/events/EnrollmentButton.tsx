'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';

interface EnrollmentButtonProps {
    eventId: string;
    isEnrolledInitial: boolean;
    isPast: boolean;
}

export default function EnrollmentButton({
    eventId,
    isEnrolledInitial,
    isPast
}: EnrollmentButtonProps) {
    const { isAuthenticated } = useAuth();
    const [isEnrolled, setIsEnrolled] = useState(isEnrolledInitial);
    const [loading, setLoading] = useState(false);

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to enroll');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/enroll`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to enroll');

            toast.success('Successfully enrolled! Check your email.');
            setIsEnrolled(true);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm('Are you sure you want to withdraw from this event?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventId}/enroll`, {
                method: 'DELETE',
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to withdraw');

            toast.success('Successfully withdrawn from the event.');
            setIsEnrolled(false);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (isEnrolled) {
        return (
            <div className="space-y-4 w-full">
                <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-bold mb-1">
                        <CheckCircle2 className="w-5 h-5" /> You're Enrolled!
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-500">
                        Check your email for access instructions and calendar invite.
                    </p>
                </div>
                <Button
                    onClick={handleWithdraw}
                    variant="outline"
                    className="w-full py-4 rounded-xl text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 hover:border-red-300 transition-all"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Withdraw from Event'}
                </Button>
            </div>
        );
    }

    return (
        <Button
            onClick={handleEnroll}
            variant="solid"
            color="primary"
            className="w-full py-7 rounded-2xl text-base font-black shadow-xl shadow-primary-200 dark:shadow-none"
            disabled={isPast || loading}
        >
            {loading ? 'Enrolling...' : isPast ? 'Event Ended' : 'Reserve My Spot'}
            {!loading && !isPast && <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />}
        </Button>
    );
}
