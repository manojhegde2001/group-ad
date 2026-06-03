'use client';

import { useState } from 'react';
import { CalendarRange, Inbox, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useMeetings } from '@/hooks/use-api/use-meetings';
import { useAuth } from '@/hooks/use-auth';
import MeetingCard from './MeetingCard';
import { cn } from '@/lib/utils';

type MeetingsSubTab = 'incoming' | 'sent' | 'confirmed';

export default function EventsMeetingsTab() {
    const { user } = useAuth();
    const { data, isLoading } = useMeetings();
    const [subTab, setSubTab] = useState<MeetingsSubTab>('incoming');

    const meetings = data?.meetings || [];
    const userId = user?.id;

    const incoming = meetings.filter(
        (m: any) => m.receiverId === userId && m.status === 'PENDING'
    );
    const sent = meetings.filter(
        (m: any) =>
            m.requesterId === userId &&
            (m.status === 'PENDING' || m.status === 'REJECTED' || m.status === 'CANCELLED')
    );
    const confirmed = meetings.filter((m: any) => m.status === 'ACCEPTED');

    const subTabs: { id: MeetingsSubTab; label: string; icon: React.ReactNode; count?: number }[] = [
        { id: 'incoming', label: 'Incoming', icon: <Inbox className="w-3.5 h-3.5" />, count: incoming.length },
        { id: 'sent', label: 'My Requests', icon: <Send className="w-3.5 h-3.5" />, count: sent.length },
        { id: 'confirmed', label: 'Confirmed', icon: <CheckCircle2 className="w-3.5 h-3.5" />, count: confirmed.length },
    ];

    const activeList = { incoming, sent, confirmed }[subTab];

    const emptyMessages: Record<MeetingsSubTab, { title: string; sub: string }> = {
        incoming: {
            title: 'No Incoming Requests',
            sub: 'When a Business user requests a 1:1 meeting with you, it will appear here.',
        },
        sent: {
            title: 'No Sent Requests',
            sub: 'Visit a Business profile and click "Request Meeting" to schedule your first 1:1.',
        },
        confirmed: {
            title: 'No Confirmed Meetings',
            sub: 'Accepted meetings will appear here with the full agenda.',
        },
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Section Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <CalendarRange className="w-5 h-5 text-primary-500" />
                    <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                        1:1 Business Meetings
                    </h2>
                </div>
                <p className="text-sm text-secondary-500 dark:text-secondary-400 ml-8">
                    Request and manage private 1:1 meetings with other Business members.
                </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-none">
                {subTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSubTab(tab.id)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border',
                            subTab === tab.id
                                ? 'bg-primary-500 text-white border-primary-500 shadow-md shadow-primary-500/20'
                                : 'bg-white dark:bg-secondary-900 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-700'
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className={cn(
                                'min-w-[18px] h-[18px] rounded-full text-[10px] font-black flex items-center justify-center px-1',
                                subTab === tab.id
                                    ? 'bg-white/30 text-white'
                                    : 'bg-primary-500 text-white'
                            )}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                </div>
            ) : activeList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-secondary-900 rounded-3xl border border-secondary-100 dark:border-secondary-800">
                    <div className="w-14 h-14 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-4">
                        <CalendarRange className="w-7 h-7 text-secondary-300" />
                    </div>
                    <h3 className="text-base font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">
                        {emptyMessages[subTab].title}
                    </h3>
                    <p className="text-sm text-secondary-500 dark:text-secondary-400 max-w-xs">
                        {emptyMessages[subTab].sub}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeList.map((meeting: any) => {
                        const isRequester = meeting.requesterId === userId;
                        const otherParty = isRequester ? meeting.receiver : meeting.requester;
                        if (!otherParty) return null;
                        return (
                            <MeetingCard
                                key={meeting.id}
                                meetingId={meeting.id}
                                otherParty={otherParty}
                                proposedTime={meeting.proposedTime}
                                agenda={meeting.agenda}
                                status={meeting.status}
                                isRequester={isRequester}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}
