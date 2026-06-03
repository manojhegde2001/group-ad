'use client';

import { useState } from 'react';
import { X, CalendarRange, Clock, AlignLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { useRequestMeeting } from '@/hooks/use-api/use-meetings';
import { format } from 'date-fns';

interface ReceiverInfo {
    id: string;
    name: string;
    companyName?: string | null;
    avatar?: string | null;
    industry?: string | null;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    receiver: ReceiverInfo;
}

export default function RequestMeetingModal({ isOpen, onClose, receiver }: Props) {
    const [proposedTime, setProposedTime] = useState('');
    const [agenda, setAgenda] = useState('');

    const { mutate: requestMeeting, isPending } = useRequestMeeting();

    // min datetime = now (rounded to next 15 min)
    const nowRounded = (() => {
        const d = new Date();
        d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
        return d.toISOString().slice(0, 16);
    })();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!proposedTime) return;

        requestMeeting(
            {
                receiverId: receiver.id,
                proposedTime: new Date(proposedTime).toISOString(),
                agenda: agenda.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setProposedTime('');
                    setAgenda('');
                    onClose();
                },
            }
        );
    };

    if (!isOpen) return null;

    const displayName = receiver.companyName || receiver.name;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-secondary-900 rounded-[2rem] shadow-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <CalendarRange className="w-5 h-5" />
                            <span className="font-black text-sm uppercase tracking-widest">Request 1:1 Meeting</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Receiver Info */}
                <div className="flex items-center gap-4 px-6 py-4 bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                    <Avatar
                        src={receiver.avatar || undefined}
                        name={displayName}
                        size="md"
                        className="ring-2 ring-primary-100 dark:ring-primary-900/30"
                    />
                    <div>
                        <p className="font-black text-secondary-900 dark:text-white text-sm uppercase tracking-tight leading-none">
                            {displayName}
                        </p>
                        {receiver.industry && (
                            <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-1">
                                {receiver.industry}
                            </p>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                    {/* Date & Time */}
                    <div>
                        <label className="flex items-center gap-1.5 text-xs font-black text-secondary-500 uppercase tracking-widest mb-2">
                            <Clock className="w-3.5 h-3.5" />
                            Proposed Date & Time <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            value={proposedTime}
                            onChange={e => setProposedTime(e.target.value)}
                            min={nowRounded}
                            required
                            className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl px-4 py-3 text-sm text-secondary-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                        />
                        {proposedTime && (
                            <p className="mt-1.5 text-[11px] text-primary-500 font-bold">
                                {format(new Date(proposedTime), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                            </p>
                        )}
                    </div>

                    {/* Agenda */}
                    <div>
                        <label className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 text-xs font-black text-secondary-500 uppercase tracking-widest">
                                <AlignLeft className="w-3.5 h-3.5" />
                                Agenda / Note
                            </span>
                            <span className={`text-[10px] font-bold ${agenda.length > 230 ? 'text-red-500' : 'text-secondary-400'}`}>
                                {agenda.length}/250
                            </span>
                        </label>
                        <textarea
                            value={agenda}
                            onChange={e => setAgenda(e.target.value)}
                            maxLength={250}
                            rows={3}
                            placeholder="What would you like to discuss?"
                            className="w-full bg-secondary-50 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-2xl px-4 py-3 text-sm text-secondary-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-primary-500/40 transition-all resize-none placeholder:text-secondary-400"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-11 rounded-2xl border-2 border-secondary-200 dark:border-secondary-700 text-xs font-black uppercase tracking-widest text-secondary-600 dark:text-secondary-400 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            color="primary"
                            variant="solid"
                            className="flex-1 h-11 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary-500/25"
                            disabled={!proposedTime || isPending}
                        >
                            {isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Send Request'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
