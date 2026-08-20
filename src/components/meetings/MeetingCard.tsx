'use client';

import { format } from 'date-fns';
import { CalendarRange, Clock, AlignLeft, CheckCircle2, XCircle, Ban, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUpdateMeeting } from '@/hooks/use-api/use-meetings';
import { cn } from '@/lib/utils';

type MeetingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

const statusConfig: Record<MeetingStatus, { label: string; className: string }> = {
    PENDING: {
        label: 'Pending',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    },
    ACCEPTED: {
        label: 'Confirmed',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
    },
    REJECTED: {
        label: 'Declined',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    },
    CANCELLED: {
        label: 'Cancelled',
        className: 'bg-secondary-100 text-secondary-500 dark:bg-secondary-800 dark:text-secondary-400',
    },
};

interface MeetingPerson {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    companyName: string | null;
}

interface MeetingCardProps {
    meetingId: string;
    otherParty: MeetingPerson;
    proposedTime: string;
    agenda?: string | null;
    status: MeetingStatus;
    /** Whether the current user is the one who sent this request */
    isRequester: boolean;
}

export default function MeetingCard({
    meetingId,
    otherParty,
    proposedTime,
    agenda,
    status,
    isRequester,
}: MeetingCardProps) {
    const { mutate: updateMeeting, isPending, variables } = useUpdateMeeting();

    const isUpdating = (s: string) => isPending && variables?.meetingId === meetingId && variables?.status === s;

    const displayName = otherParty.companyName || otherParty.name;

    return (
        <div className="bg-white dark:bg-secondary-900 rounded-[1.5rem] border border-secondary-100 dark:border-secondary-800 overflow-hidden hover:shadow-md transition-shadow">
            {/* Top: person info + status badge */}
            <div className="flex items-center gap-4 px-5 py-4">
                <Link href={`/profile/${otherParty.username}`}>
                    <Avatar
                        src={otherParty.avatar || undefined}
                        name={displayName}
                        size="md"
                        className="ring-2 ring-transparent hover:ring-primary-100 dark:hover:ring-primary-900/30 transition-all cursor-pointer"
                    />
                </Link>
                <div className="flex-1 min-w-0">
                    <Link
                        href={`/profile/${otherParty.username}`}
                        className="font-black text-sm text-secondary-900 dark:text-white uppercase tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors block truncate"
                    >
                        {displayName}
                    </Link>
                    {otherParty.companyName && (
                        <span className="px-2 py-0.5 rounded-md bg-secondary-100 dark:bg-secondary-800 text-secondary-500 font-bold text-[10px] uppercase tracking-widest">
                            {otherParty.companyName}
                        </span>
                    )}
                </div>
                <span className={cn(
                    'px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap',
                    statusConfig[status].className
                )}>
                    {statusConfig[status].label}
                </span>
            </div>

            {/* Divider */}
            <div className="border-t border-secondary-50 dark:border-secondary-800" />

            {/* Meeting Details */}
            <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                    <CalendarRange className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="text-sm font-semibold">
                        {format(new Date(proposedTime), 'EEEE, MMMM d, yyyy')}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-secondary-600 dark:text-secondary-400">
                    <Clock className="w-4 h-4 text-primary-500 shrink-0" />
                    <span className="text-sm font-semibold">
                        {format(new Date(proposedTime), 'h:mm a')}
                    </span>
                </div>
                {agenda && (
                    <div className="flex items-start gap-2 text-secondary-500 dark:text-secondary-400">
                        <AlignLeft className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                        <p className="text-sm leading-relaxed line-clamp-2">{agenda}</p>
                    </div>
                )}
            </div>

            {/* Actions — only shown for PENDING meetings */}
            {status === 'PENDING' && (
                <div className="px-5 pb-4 flex items-center gap-2">
                    {!isRequester && (
                        <>
                            {/* Receiver: Accept */}
                            <Button
                                size="sm"
                                color="primary"
                                variant="solid"
                                className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm shadow-primary-500/20"
                                onClick={() => updateMeeting({ meetingId, status: 'ACCEPTED' })}
                                disabled={isPending}
                            >
                                {isUpdating('ACCEPTED') ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Accept</>
                                )}
                            </Button>
                            {/* Receiver: Reject */}
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border-secondary-200 dark:border-secondary-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-900/30"
                                onClick={() => updateMeeting({ meetingId, status: 'REJECTED' })}
                                disabled={isPending}
                            >
                                {isUpdating('REJECTED') ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <><XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline</>
                                )}
                            </Button>
                        </>
                    )}
                    {isRequester && (
                        /* Requester: Cancel */
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-[10px] font-black uppercase tracking-widest rounded-xl border-secondary-200 dark:border-secondary-700 text-secondary-500 w-full"
                            onClick={() => updateMeeting({ meetingId, status: 'CANCELLED' })}
                            disabled={isPending}
                        >
                            {isUpdating('CANCELLED') ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <><Ban className="w-3.5 h-3.5 mr-1.5" /> Cancel Request</>
                            )}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
