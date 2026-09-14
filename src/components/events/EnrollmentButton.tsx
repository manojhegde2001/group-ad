'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, AlertCircle, Lock, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { useEnrollEvent, useUnenrollEvent } from '@/hooks/use-api/use-events';
import { seatsLabel } from '@/lib/event-eligibility';

interface EnrollmentButtonProps {
    eventId: string;
    enrollmentStatus: 'APPROVED' | 'PENDING' | 'REJECTED' | 'CANCELLED' | null;
    isPast: boolean;
    isCancelled?: boolean;
    /** Remaining overall seats; null = uncapped. */
    seatsLeft?: number | null;
    /** Resolved message when the viewer is not eligible to enroll. */
    ineligibleReason?: string | null;
}

export default function EnrollmentButton({
    eventId,
    enrollmentStatus,
    isPast,
    isCancelled = false,
    seatsLeft = null,
    ineligibleReason = null,
}: EnrollmentButtonProps) {
    const { isAuthenticated } = useAuth();
    const enrollMutation = useEnrollEvent();
    const unenrollMutation = useUnenrollEvent();
    const [isConfirmWithdrawOpen, setIsConfirmWithdrawOpen] = useState(false);

    const isEnrolled = enrollmentStatus === 'APPROVED';
    const isWaitlisted = enrollmentStatus === 'PENDING';
    const loading = enrollMutation.isPending || unenrollMutation.isPending;
    const isFull = seatsLeft != null && seatsLeft <= 0;

    const handleEnroll = () => {
        if (!isAuthenticated) {
            toast.error('Please log in to reserve a spot');
            return;
        }
        enrollMutation.mutate(eventId);
    };

    const onConfirmWithdraw = () => {
        unenrollMutation.mutate(eventId, { onSuccess: () => setIsConfirmWithdrawOpen(false) });
    };

    const withdrawModal = (
        <ConfirmModal
            isOpen={isConfirmWithdrawOpen}
            onClose={() => setIsConfirmWithdrawOpen(false)}
            onConfirm={onConfirmWithdraw}
            title={isWaitlisted ? 'Cancel registration' : 'Withdraw from event'}
            message={
                isWaitlisted
                    ? 'Cancel your waitlist registration? You can rejoin later while seats last.'
                    : 'Withdraw from this event? Your seat may be given to someone on the waitlist.'
            }
            confirmLabel={isWaitlisted ? 'Cancel registration' : 'Withdraw'}
            isLoading={unenrollMutation.isPending}
            variant="danger"
        />
    );

    // ── Terminal states ────────────────────────────────────────────────
    if (isCancelled) {
        return (
            <Button variant="flat" color="secondary" className="w-full py-4 rounded-xl font-bold" disabled>
                Event cancelled
            </Button>
        );
    }

    if (isPast && !isEnrolled && !isWaitlisted) {
        return (
            <Button variant="flat" color="secondary" className="w-full py-4 rounded-xl font-bold" disabled>
                Event ended
            </Button>
        );
    }

    // ── Enrolled / waitlisted ──────────────────────────────────────────
    if (isEnrolled || isWaitlisted) {
        return (
            <div className="space-y-3 w-full">
                <div
                    className={`w-full rounded-2xl p-4 text-center border ${
                        isEnrolled
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
                    }`}
                >
                    <div
                        className={`flex items-center justify-center gap-2 font-bold ${
                            isEnrolled ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'
                        }`}
                    >
                        {isEnrolled ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {isEnrolled ? "You're going" : "You're on the waitlist"}
                    </div>
                    <p
                        className={`text-xs mt-1 ${
                            isEnrolled ? 'text-green-600 dark:text-green-500' : 'text-amber-600 dark:text-amber-500'
                        }`}
                    >
                        {isEnrolled
                            ? 'Check your email for access details and a calendar invite.'
                            : 'An organiser approves waitlisted guests when a seat opens up.'}
                    </p>
                </div>
                <Button
                    onClick={() => setIsConfirmWithdrawOpen(true)}
                    variant="outline"
                    className="w-full py-3.5 rounded-xl text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 hover:border-red-300"
                    disabled={loading}
                >
                    {loading ? 'Processing…' : isWaitlisted ? 'Cancel registration' : 'Withdraw'}
                </Button>
                {withdrawModal}
            </div>
        );
    }

    // ── Not eligible ───────────────────────────────────────────────────
    if (ineligibleReason) {
        return (
            <div className="w-full rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-secondary-400 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-secondary-800 dark:text-secondary-200">Not open to you</p>
                    <p className="text-xs text-secondary-500 mt-0.5">{ineligibleReason}</p>
                </div>
            </div>
        );
    }

    // ── Open for enrollment ────────────────────────────────────────────
    const label = seatsLabel(seatsLeft);
    return (
        <div className="space-y-2 w-full">
            <Button
                onClick={handleEnroll}
                variant="solid"
                color="primary"
                className="w-full py-6 rounded-2xl text-base font-black shadow-xl shadow-primary-200 dark:shadow-none"
                disabled={loading}
                isLoading={loading}
            >
                {isFull ? 'Join the waitlist' : 'Reserve my spot'}
                {!loading && !isFull && <ArrowRight className="w-5 h-5 ml-2" />}
            </Button>
            {(isFull || label) && (
                <p className="text-xs font-semibold text-center text-secondary-500 flex items-center justify-center gap-1.5">
                    {isFull ? (
                        <>
                            <Clock className="w-3.5 h-3.5" /> Fully booked — join the waitlist and we&apos;ll notify you.
                        </>
                    ) : (
                        label
                    )}
                </p>
            )}
        </div>
    );
}
