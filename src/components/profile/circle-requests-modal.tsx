'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Modal, Drawer } from 'rizzui';
import { X, UserPlus, Loader2, BadgeCheck, Check, Clock } from 'lucide-react';
import { usePendingConnections, useUpdateConnectionMutation, useRemoveConnectionMutation } from '@/hooks/use-api/use-connections';
import { Avatar } from '@/components/ui/avatar';

interface CircleRequestsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/** Desktop → centered dialog · Phone → bottom drawer. */
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 640px)');
        const sync = () => setIsDesktop(mq.matches);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, []);
    return isDesktop;
}

export function CircleRequestsModal({ isOpen, onClose }: CircleRequestsModalProps) {
    const { data, isLoading } = usePendingConnections();
    const updateMutation = useUpdateConnectionMutation();
    const removeMutation = useRemoveConnectionMutation();
    const isDesktop = useIsDesktop();

    const received = useMemo(
        () => (data?.connections || []).filter((c) => c.direction === 'received' && c.user),
        [data]
    );
    const sent = useMemo(
        () => (data?.connections || []).filter((c) => c.direction === 'sent' && c.user),
        [data]
    );

    const body = (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                <h2 className="text-lg sm:text-xl font-black text-secondary-900 dark:text-white uppercase tracking-normal">
                    Circle Requests
                    {received.length > 0 && (
                        <span className="ml-2 text-secondary-400 dark:text-secondary-500">{received.length}</span>
                    )}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 text-secondary-500 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center py-16 text-secondary-400 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Loading...</span>
                    </div>
                ) : received.length === 0 && sent.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-secondary-400 gap-2 text-center">
                        <UserPlus className="w-8 h-8 opacity-40" />
                        <span className="text-[10px] uppercase font-black tracking-widest">No pending requests</span>
                    </div>
                ) : (
                    <>
                        {received.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Received</p>
                                {received.map((c) => {
                                    const u = c.user;
                                    const displayName = u.companyName || u.name;
                                    const loading = updateMutation.isPending && updateMutation.variables?.targetUserId === u.id;
                                    return (
                                        <div
                                            key={u.id}
                                            className="flex items-center gap-3 p-2.5 rounded-2xl border border-secondary-50 dark:border-secondary-800 bg-white dark:bg-secondary-900"
                                        >
                                            <Avatar src={u.avatar || undefined} name={displayName} size="md" rounded="xl" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <p className="text-sm font-bold text-secondary-900 dark:text-white truncate">{displayName}</p>
                                                    {u.userType === 'BUSINESS' && <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] font-bold text-secondary-400 truncate">@{u.username}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => updateMutation.mutate({ targetUserId: u.id, action: 'ACCEPT' })}
                                                    disabled={loading}
                                                    className="flex items-center justify-center h-8 px-3 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:bg-secondary-800 dark:hover:bg-secondary-100 font-black uppercase tracking-widest text-[10px] transition-colors disabled:opacity-60"
                                                >
                                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                <button
                                                    onClick={() => updateMutation.mutate({ targetUserId: u.id, action: 'REJECT' })}
                                                    disabled={loading}
                                                    className="flex items-center justify-center h-8 px-3 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 font-black uppercase tracking-widest text-[10px] transition-colors disabled:opacity-60"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {sent.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Sent</p>
                                {sent.map((c) => {
                                    const u = c.user;
                                    const displayName = u.companyName || u.name;
                                    const loading = removeMutation.isPending && removeMutation.variables === u.id;
                                    return (
                                        <div
                                            key={u.id}
                                            className="flex items-center gap-3 p-2.5 rounded-2xl border border-secondary-50 dark:border-secondary-800 bg-white dark:bg-secondary-900"
                                        >
                                            <Avatar src={u.avatar || undefined} name={displayName} size="md" rounded="xl" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <p className="text-sm font-bold text-secondary-900 dark:text-white truncate">{displayName}</p>
                                                    {u.userType === 'BUSINESS' && <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />}
                                                </div>
                                                <p className="text-[11px] font-bold text-secondary-400 truncate">@{u.username}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <Link
                                                    href={`/profile/${u.username}`}
                                                    onClick={onClose}
                                                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-secondary-100 dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400 font-black uppercase tracking-widest text-[10px]"
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    Requested
                                                </Link>
                                                <button
                                                    onClick={() => removeMutation.mutate(u.id)}
                                                    disabled={loading}
                                                    className="flex items-center justify-center h-8 px-3 rounded-full bg-secondary-100 dark:bg-secondary-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-secondary-600 dark:text-secondary-300 hover:text-red-600 dark:hover:text-red-400 font-black uppercase tracking-widest text-[10px] transition-colors disabled:opacity-60"
                                                >
                                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Cancel'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    if (isDesktop) {
        return (
            <Modal isOpen={isOpen} onClose={onClose} containerClassName="flex items-center justify-center p-4">
                <div className="relative w-full max-w-md h-auto max-h-[70vh] bg-white dark:bg-secondary-950 rounded-3xl shadow-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800 flex flex-col">
                    {body}
                </div>
            </Modal>
        );
    }

    return (
        <Drawer
            isOpen={isOpen}
            onClose={onClose}
            placement="bottom"
            size="full"
            containerClassName="h-[85dvh] max-h-[85dvh] rounded-t-3xl overflow-hidden bg-white dark:bg-secondary-950 flex flex-col"
        >
            {body}
        </Drawer>
    );
}
