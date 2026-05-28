'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useEnrollEvent, useUnenrollEvent } from '@/hooks/use-api/use-events';

interface EnrollmentButtonProps {
    eventId: string;
    enrollmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | null;
    isPast: boolean;
    isFull: boolean;
}

export default function EnrollmentButton({
    eventId,
    enrollmentStatus,
    isPast,
    isFull
}: EnrollmentButtonProps) {
    const { isAuthenticated } = useAuth();
    const enrollMutation = useEnrollEvent();
    const unenrollMutation = useUnenrollEvent();
    const [isConfirmWithdrawOpen, setIsConfirmWithdrawOpen] = useState(false);

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            toast.error('Please log in to enroll');
            return;
        }
        enrollMutation.mutate(eventId);
    };

    const handleWithdraw = async () => {
        setIsConfirmWithdrawOpen(true);
    };

    const onConfirmWithdraw = () => {
        unenrollMutation.mutate(eventId, {
            onSuccess: () => {
                setIsConfirmWithdrawOpen(false);
            }
        });
    };

    const isEnrolled = enrollmentStatus === 'APPROVED';
    const isWaitlisted = enrollmentStatus === 'PENDING';
    const loading = enrollMutation.isPending || unenrollMutation.isPending;

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
                <ConfirmModal
                    isOpen={isConfirmWithdrawOpen}
                    onClose={() => setIsConfirmWithdrawOpen(false)}
                    onConfirm={onConfirmWithdraw}
                    title="Withdraw from Event"
                    message="Are you sure you want to withdraw from this event?"
                    confirmLabel="Withdraw"
                    isLoading={unenrollMutation.isPending}
                    variant="danger"
                />
            </div>
        );
    }

    if (isWaitlisted) {
        return (
            <div className="space-y-4 w-full">
                <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-1">
                        <AlertCircle className="w-5 h-5" /> You're on the Waitlist
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                        You'll be promoted automatically if a spot opens up.
                    </p>
                </div>
                <Button
                    onClick={handleWithdraw}
                    variant="outline"
                    className="w-full py-4 rounded-xl text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 hover:border-red-300 transition-all"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Cancel Registration'}
                </Button>
                <ConfirmModal
                    isOpen={isConfirmWithdrawOpen}
                    onClose={() => setIsConfirmWithdrawOpen(false)}
                    onConfirm={onConfirmWithdraw}
                    title="Cancel Registration"
                    message="Are you sure you want to cancel your waitlist registration?"
                    confirmLabel="Cancel Waitlist"
                    isLoading={unenrollMutation.isPending}
                    variant="danger"
                />
            </div>
        );
    }

    return (
        <>
            <Button
                onClick={handleEnroll}
                variant="solid"
                color="primary"
                className="w-full py-7 rounded-2xl text-base font-black shadow-xl shadow-primary-200 dark:shadow-none"
                disabled={isPast || loading}
            >
                {isPast ? 'Event Ended' : isFull ? 'Join the Waitlist' : 'Reserve My Spot'}
                {!loading && !isPast && <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />}
            </Button>
        </>
    );
}
