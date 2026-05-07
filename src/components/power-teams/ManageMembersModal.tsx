'use client';

import { Modal, Button, Avatar } from 'rizzui';
import { X, Check, UserMinus, ShieldAlert, Users, Clock } from 'lucide-react';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import { useUpdatePowerTeamMember, useLeavePowerTeam } from '@/hooks/use-api/use-power-teams';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export function ManageMembersModal() {
    const { manageMembersOpen, closeManageMembers, activeTeam } = usePowerTeamModal();
    const { user } = useAuth();
    
    const updateMemberMutation = useUpdatePowerTeamMember();
    const removeMemberMutation = useLeavePowerTeam(); // Can be used by admin to remove others too

    if (!activeTeam) return null;

    const pendingRequests = activeTeam.members?.filter((m: any) => m.status === 'PENDING') || [];
    const approvedMembers = activeTeam.members?.filter((m: any) => m.status === 'APPROVED' && m.userId !== activeTeam.creatorId) || [];
    const isCreator = activeTeam.creatorId === user?.id;

    const handleAction = async (memberId: string, status: string) => {
        updateMemberMutation.mutate({
            slug: activeTeam.slug,
            data: { memberId, status }
        });
    };

    const handleRemove = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this partner?')) return;
        removeMemberMutation.mutate({
            slug: activeTeam.slug,
            memberId
        });
    };

    return (
        <Modal
            isOpen={manageMembersOpen}
            onClose={closeManageMembers}
            containerClassName="flex items-center justify-center"
        >
            <div className="w-full max-w-2xl bg-white dark:bg-secondary-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-secondary-100 dark:border-secondary-800">
                {/* Header */}
                <div className="px-8 py-6 border-b border-secondary-50 dark:border-secondary-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-primary-500/10 text-primary-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Manage Partners</h2>
                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-0.5">{activeTeam.name}</p>
                        </div>
                    </div>
                    <button onClick={closeManageMembers} className="p-2 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Pending Requests */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-amber-500" />
                            <h3 className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-widest">Pending Requests ({pendingRequests.length})</h3>
                        </div>
                        <div className="space-y-3">
                            {pendingRequests.map((req: any) => (
                                <div key={req.id} className="p-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={req.user?.avatar} name={req.user?.name} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <p className="text-xs font-black text-secondary-900 dark:text-white uppercase">{req.user?.name}</p>
                                            <p className="text-[10px] text-secondary-400 font-bold">@{req.user?.username}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            onClick={() => handleAction(req.id, 'APPROVED')}
                                            className="h-9 px-4 rounded-xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <Check className="w-3.5 h-3.5 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleAction(req.id, 'REJECTED')}
                                            className="h-9 px-4 rounded-xl border-secondary-200 text-red-500 font-black text-[10px] uppercase tracking-widest"
                                        >
                                            <X className="w-3.5 h-3.5 mr-1" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {pendingRequests.length === 0 && (
                                <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest text-center py-4 bg-secondary-50/50 dark:bg-secondary-800/20 rounded-2xl italic">No pending requests</p>
                            )}
                        </div>
                    </section>

                    {/* Active Partners */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldAlert className="w-4 h-4 text-primary-500" />
                            <h3 className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-widest">Active Partners ({approvedMembers.length})</h3>
                        </div>
                        <div className="space-y-3">
                            {approvedMembers.map((member: any) => (
                                <div key={member.id} className="p-4 rounded-2xl bg-white dark:bg-secondary-800/20 border border-secondary-100 dark:border-secondary-800 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <Avatar src={member.user?.avatar} name={member.user?.name} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <p className="text-xs font-black text-secondary-900 dark:text-white uppercase">{member.user?.name}</p>
                                            <p className="text-[10px] text-secondary-400 font-bold">Partner since {new Date(member.joinedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="text"
                                        onClick={() => handleRemove(member.id)}
                                        className="h-9 w-9 p-0 rounded-xl text-secondary-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <UserMinus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-secondary-50 dark:bg-secondary-800/40 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Alliance Governance Active</p>
                    <Button
                        variant="text"
                        onClick={closeManageMembers}
                        className="h-8 rounded-lg font-black text-[10px] uppercase tracking-widest"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
