'use client';

import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Users, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useCoAttendees } from '@/hooks/use-api/use-events';
import { useConnectMutation } from '@/hooks/use-api/use-connections';
import { useFollowUser } from '@/hooks/use-api/use-user';
import { cn } from '@/lib/utils';

interface CoAttendee {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    userType: string;
    companyName: string | null;
    category: { name: string } | null;
    isFollowing: boolean;
    isConnected: boolean;
}

export default function AttendeeConnectBanner({ eventId }: { eventId: string }) {
    // Queries
    const { data: attendeesData, isLoading, refetch } = useCoAttendees(eventId);
    const coAttendees = (attendeesData?.coAttendees || []) as CoAttendee[];

    // Mutations
    const connectMutation = useConnectMutation();
    const followMutation = useFollowUser();

    const handleConnect = (userId: string) => {
        connectMutation.mutate(userId, {
            onSuccess: () => refetch()
        });
    };

    const handleFollow = (userId: string) => {
        followMutation.mutate(userId, {
            onSuccess: () => refetch()
        });
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-secondary-900 p-6 rounded-3xl border border-secondary-100 dark:border-secondary-800 flex justify-center py-10 shadow-sm">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
        );
    }

    if (coAttendees.length === 0) {
        return null;
    }

    return (
        <section className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/10 dark:to-indigo-900/10 p-8 rounded-[2.5rem] border border-primary-100 dark:border-primary-900/30 overflow-hidden relative shadow-sm">
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <Users className="w-48 h-48 text-primary-900 dark:text-white" />
            </div>
            
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-secondary-900 dark:text-white mb-2 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    Connect with Co-Attendees
                </h2>
                <p className="text-sm text-secondary-600 dark:text-secondary-400 mb-6 max-w-lg">
                    We saw you at the event! Here are some people who also attended. Connect with them to grow your network and unlock mutual contact numbers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coAttendees.map(user => {
                        const isConnecting = connectMutation.isPending && connectMutation.variables === user.id;
                        const isFollowing = followMutation.isPending && followMutation.variables === user.id;

                        return (
                            <div key={user.id} className="bg-white dark:bg-secondary-900 p-4 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
                                <Link href={`/profile/${user.username}`}>
                                    <Avatar 
                                        src={user.avatar || undefined} 
                                        name={user.name} 
                                        size="md" 
                                        className="cursor-pointer ring-2 ring-transparent group-hover:ring-primary-100 dark:group-hover:ring-primary-900/50 transition-all"
                                    />
                                </Link>
                                
                                <div className="flex-1 min-w-0">
                                    <Link href={`/profile/${user.username}`} className="font-bold text-sm text-secondary-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 truncate block uppercase tracking-tight">
                                        {user.name}
                                    </Link>
                                    <p className="text-[10px] text-secondary-400 truncate mt-0.5 font-bold uppercase tracking-widest">
                                        {user.companyName ? `${user.companyName} · ` : ''}{user.userType}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                    {user.isConnected ? (
                                        <span className="flex items-center justify-center h-8 px-3 rounded-lg bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-[10px] font-black uppercase tracking-widest w-full">
                                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Connected
                                        </span>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="h-8 text-[10px] font-black tracking-widest uppercase px-4 rounded-xl border-secondary-200"
                                            onClick={() => handleConnect(user.id)}
                                            disabled={isConnecting}
                                        >
                                            {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><UserPlus className="w-3.5 h-3.5 mr-2" /> Connect</>}
                                        </Button>
                                    )}

                                    {user.isFollowing ? (
                                        <span className="flex items-center justify-center h-8 px-3 rounded-lg bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400 text-[10px] font-black uppercase tracking-widest w-full">
                                            <UserCheck className="w-3.5 h-3.5 mr-1" /> Following
                                        </span>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            color="primary"
                                            variant="solid" 
                                            className="h-8 text-[10px] font-black tracking-widest uppercase px-4 rounded-xl shadow-lg shadow-primary-500/20"
                                            onClick={() => handleFollow(user.id)}
                                            disabled={isFollowing}
                                        >
                                            {isFollowing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><ArrowRight className="w-3.5 h-3.5 mr-2" /> Follow</>}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
