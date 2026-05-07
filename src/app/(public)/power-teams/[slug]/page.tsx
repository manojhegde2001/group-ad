'use client';

import { useParams } from 'next/navigation';
import { usePowerTeam } from '@/hooks/use-api/use-power-teams';
import { PowerTeamHeader } from '@/components/power-teams/PowerTeamHeader';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldCheck, Info, MessageSquare, ExternalLink, User, Users, Globe } from 'lucide-react';
import { Button } from 'rizzui';
import Link from 'next/link';
import { ManageMembersModal } from '@/components/power-teams/ManageMembersModal';
import { EditTeamModal } from '@/components/power-teams/EditTeamModal';

export default function PowerTeamDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data, isLoading } = usePowerTeam(slug);
  const team = data?.team;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        <Skeleton className="h-80 w-full rounded-[3rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full rounded-3xl" />
           </div>
           <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 mb-6">
          <Info className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Team Not Found</h1>
        <p className="text-secondary-500 mt-2">This power team may have been removed or the link is broken.</p>
        <Link href="/power-teams" className="mt-8 text-primary-500 font-black uppercase tracking-widest text-xs hover:underline">
          Back to all teams
        </Link>
      </div>
    );
  }

  const approvedMembers = team.members?.filter((m: any) => m.status === 'APPROVED') || [];

  return (
    <main className="min-h-screen bg-white dark:bg-secondary-950 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        
        <PowerTeamHeader team={team} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-16">
          
          {/* Main Content: Partners List */}
          <div className="lg:col-span-2 space-y-10">
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  Strategic Partners
                </h2>
                <div className="px-3 py-1 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-[10px] font-black text-secondary-500 uppercase tracking-widest">
                  {approvedMembers.length} Partners
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {approvedMembers.map((member: any) => (
                  <div 
                    key={member.id} 
                    className="group flex items-center gap-4 p-4 rounded-3xl bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 hover:border-primary-500/30 hover:shadow-xl transition-all duration-300"
                  >
                    <Link href={`/profile/${member.user.username}`}>
                        <Avatar 
                          src={member.user.avatar} 
                          name={member.user.name} 
                          size="md" 
                          className="w-14 h-14 rounded-2xl ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all"
                        />
                    </Link>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="font-black text-secondary-900 dark:text-white truncate text-sm uppercase tracking-tight">
                                {member.user.name}
                            </p>
                            {member.user.verificationStatus === 'VERIFIED' && (
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                        </div>
                        <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest truncate mt-0.5">
                            {member.user.industry || 'Business Partner'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                           <button className="p-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-primary-500 transition-colors">
                              <MessageSquare className="w-3.5 h-3.5" />
                           </button>
                           <Link href={`/profile/${member.user.username}`} className="p-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-primary-500 transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                           </Link>
                        </div>
                    </div>
                    {member.role === 'ADMIN' && (
                        <div className="shrink-0 px-2 py-0.5 rounded-md bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 text-[8px] font-black uppercase tracking-[0.2em] self-start">
                           Founder
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* About / Description */}
            <div className="p-8 sm:p-10 rounded-[3rem] bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800/50">
               <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-4">Mission Statement</h3>
               <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed font-medium">
                  {team.description || "This power team is dedicated to fostering high-level strategic partnerships within its industry. Our members collaborate to share specialized knowledge, referral opportunities, and professional growth."}
               </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Team Stats / Info */}
            <div className="p-8 rounded-[2.5rem] bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 shadow-sm">
               <h3 className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em] mb-6">Alliance Details</h3>
               <div className="space-y-6">
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Verification Status</p>
                        <p className="text-sm font-bold text-secondary-900 dark:text-white mt-1">Platform Verified</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Industry Target</p>
                        <p className="text-sm font-bold text-secondary-900 dark:text-white mt-1">{team.category?.name}</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-4">
                     <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Visibility</p>
                        <p className="text-sm font-bold text-secondary-900 dark:text-white mt-1 uppercase">{team.visibility} Alliance</p>
                     </div>
                  </div>
               </div>

               <div className="mt-10 pt-8 border-t border-secondary-50 dark:border-secondary-800 flex items-center gap-4">
                  <Avatar src={team.creator?.avatar} name={team.creator?.name} className="w-12 h-12 rounded-2xl" />
                  <div>
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Created By</p>
                    <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight mt-0.5">{team.creator?.name}</p>
                  </div>
               </div>
            </div>
          </div>

        </div>
      </div>
      
      <ManageMembersModal />
      <EditTeamModal />
    </main>
  );
}
