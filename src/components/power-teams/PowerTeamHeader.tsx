'use client';

import { Building, Users, Globe, Lock, Share2, ShieldCheck, UserPlus, LogOut, Settings } from 'lucide-react';
import { Button } from 'rizzui';
import { Avatar } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import { useJoinPowerTeam, useLeavePowerTeam } from '@/hooks/use-api/use-power-teams';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80';

interface PowerTeamHeaderProps {
  team: any;
}

export function PowerTeamHeader({ team }: PowerTeamHeaderProps) {
  const { user } = useAuth();
  const { openManageMembers, openEditTeam } = usePowerTeamModal();
  const joinMutation = useJoinPowerTeam();
  const leaveMutation = useLeavePowerTeam();

  const isMember = team.members?.some((m: any) => m.userId === user?.id && m.status === 'APPROVED');
  const isPending = team.members?.some((m: any) => m.userId === user?.id && m.status === 'PENDING');
  const isCreator = team.creatorId === user?.id;
  const isAdmin = (user as any)?.userType === 'ADMIN';

  const myMembership = team.members?.find((m: any) => m.userId === user?.id);

  const handleJoin = () => {
    if ((user as any)?.userType !== 'BUSINESS') {
        toast.error('Only business accounts can join Power Teams');
        return;
    }
    joinMutation.mutate(team.slug);
  };

  const handleLeave = () => {
    if (!confirm('Are you sure you want to leave this Power Team?')) return;
    if (myMembership) {
        leaveMutation.mutate({ slug: team.slug, memberId: myMembership.id });
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-64 sm:h-80 w-full relative overflow-hidden rounded-[3rem] shadow-2xl">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: `url('${team.banner || DEFAULT_BANNER}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-6 right-6 flex gap-2">
            <button 
                onClick={handleShare}
                className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
            >
                <Share2 className="w-5 h-5" />
            </button>
            {(isCreator || isAdmin) && (
                <button 
                    onClick={() => openEditTeam(team)}
                    className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-90"
                >
                    <Settings className="w-5 h-5" />
                </button>
            )}
        </div>
      </div>

      {/* Profile Info Overlay */}
      <div className="max-w-7xl mx-auto px-4 sm:px-10 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            {/* Logo */}
            <div className="w-40 h-40 rounded-[2.5rem] bg-white dark:bg-secondary-900 p-2 shadow-2xl border-4 border-white dark:border-secondary-900 ring-1 ring-secondary-100 dark:ring-secondary-800">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-[2rem]" />
              ) : (
                <div className="w-full h-full rounded-[2rem] bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center text-secondary-300">
                  <Building className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="pb-4 space-y-2">
               <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <h1 className="text-3xl sm:text-4xl font-black text-white md:text-secondary-900 dark:md:text-white uppercase tracking-tighter drop-shadow-lg md:drop-shadow-none">
                    {team.name}
                  </h1>
                  <div className="px-3 py-1 rounded-full bg-primary-500/10 text-primary-500 border border-primary-500/20 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                     <ShieldCheck className="w-3.5 h-3.5" />
                     Verified Team
                  </div>
               </div>

               <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-black uppercase tracking-widest text-secondary-400">
                  <div className="flex items-center gap-2">
                     <Users className="w-4 h-4" />
                     {team._count?.members || 0} Strategic Partners
                  </div>
                  <div className="flex items-center gap-2">
                     {team.visibility === 'PUBLIC' ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                     {team.visibility} Alliance
                  </div>
                  <div className="px-3 py-1 rounded-lg bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400">
                     {team.category?.name}
                  </div>
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pb-4">
            {!isMember && !isPending && !isCreator && (user as any)?.userType === 'BUSINESS' && (
              <Button
                onClick={handleJoin}
                isLoading={joinMutation.isPending}
                className="h-12 px-8 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-primary-500/20 active:scale-95 transition-all"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Request Partnership
              </Button>
            )}
            {isPending && (
              <div className="h-12 px-8 rounded-2xl bg-amber-100 text-amber-600 font-black text-xs uppercase tracking-widest flex items-center border border-amber-200">
                 Request Pending
              </div>
            )}
            {isMember && !isCreator && (
              <Button
                variant="outline"
                onClick={handleLeave}
                isLoading={leaveMutation.isPending}
                className="h-12 px-8 rounded-2xl border-2 border-red-100 dark:border-red-900/30 text-red-500 font-black text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 active:scale-95 transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Exit Team
              </Button>
            )}
            {isCreator && (
              <Button
                onClick={() => openManageMembers(team)}
                className="h-12 px-8 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all"
              >
                Manage Partners
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
