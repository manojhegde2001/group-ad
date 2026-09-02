'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Modal, Drawer } from 'rizzui';
import { X, Search, Users, Loader2, MessageSquare, BadgeCheck, ArrowUpRight } from 'lucide-react';
import { useConnections } from '@/hooks/use-api/use-connections';
import { Avatar } from '@/components/ui/avatar';

interface ConnectionsModalProps {
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

export function ConnectionsModal({ isOpen, onClose }: ConnectionsModalProps) {
    const { data, isLoading } = useConnections();
    const [query, setQuery] = useState('');
    const isDesktop = useIsDesktop();

    const connections = useMemo(() => {
        const list = (data?.connections || []).filter((c) => c.status === 'ACCEPTED' && c.user);
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((c) => {
            const name = (c.user.companyName || c.user.name || '').toLowerCase();
            const username = (c.user.username || '').toLowerCase();
            return name.includes(q) || username.includes(q);
        });
    }, [data, query]);

    const body = (
        <div className="flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-secondary-100 dark:border-secondary-800 shrink-0">
                <h2 className="text-lg sm:text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">
                    Your Circle
                    {connections.length > 0 && (
                        <span className="ml-2 text-secondary-400 dark:text-secondary-500">{connections.length}</span>
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

            {/* Search */}
            <div className="px-5 sm:px-6 pt-4 pb-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search your circle..."
                        className="w-full bg-secondary-50 dark:bg-secondary-900 rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none border border-secondary-100 dark:border-secondary-800 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-2">
                {isLoading ? (
                    <div className="flex flex-col items-center py-16 text-secondary-400 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                        <span className="text-[10px] uppercase font-black tracking-widest">Loading...</span>
                    </div>
                ) : connections.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-secondary-400 gap-2 text-center">
                        <Users className="w-8 h-8 opacity-40" />
                        <span className="text-[10px] uppercase font-black tracking-widest">
                            {query ? 'No matches' : 'No one in your circle yet'}
                        </span>
                    </div>
                ) : (
                    connections.map((c) => {
                        const u = c.user;
                        const displayName = u.companyName || u.name;
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
                                        href={`/messages?userId=${u.id}`}
                                        onClick={onClose}
                                        className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 hover:bg-secondary-800 dark:hover:bg-secondary-100 font-black uppercase tracking-widest text-[10px] transition-colors"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                        Message
                                    </Link>
                                    <Link
                                        href={`/profile/${u.username}`}
                                        onClick={onClose}
                                        className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary-100 dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 text-secondary-700 dark:text-secondary-300 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors"
                                        aria-label={`View ${displayName}'s profile`}
                                    >
                                        <ArrowUpRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })
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
