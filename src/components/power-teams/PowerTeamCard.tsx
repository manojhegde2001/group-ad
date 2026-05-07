'use client';

import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { Building, Users, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';

interface PowerTeamCardProps {
  team: any;
  className?: string;
}

export function PowerTeamCard({ team, className }: PowerTeamCardProps) {
  const { user } = useAuth();
  const memberCount = team._count?.members || 0;
  const recentMembers = team.members || [];
  
  const pendingCount = team.allMembers?.filter((m: any) => m.status === 'PENDING').length || 0;
  const isCreator = team.creatorId === user?.id;
  const isAdmin = (user as any)?.userType === 'ADMIN';

  return (
    <Link
      href={`/power-teams/${team.slug}`}
      className={cn(
        "group relative block w-full rounded-[2.5rem] bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800/50 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500",
        className
      )}
    >
      {/* Banner Section */}
      <div className="relative h-32 w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{ backgroundImage: `url('${team.banner || DEFAULT_BANNER}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Industry Badge */}
        <div className="absolute top-4 left-4">
          <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 shadow-xl">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
            {team.category?.name || 'General Industry'}
          </div>
        </div>

        {/* Pending Badge Notification */}
        {(isCreator || isAdmin) && pendingCount > 0 && (
          <div className="absolute top-4 right-4 animate-pulse">
            <div className="px-2 py-1 rounded-lg bg-red-500 text-white text-[8px] font-black uppercase tracking-tighter shadow-lg border border-red-400">
              {pendingCount} Pending Requests
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="relative px-6 pb-6 pt-10">
        {/* Logo/Avatar - Overlapping */}
        <div className="absolute -top-8 left-6">
          <div className="w-16 h-16 rounded-2xl bg-white dark:bg-secondary-800 p-1 shadow-xl border border-secondary-100 dark:border-secondary-700">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full rounded-xl bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center text-secondary-400">
                <Building className="w-8 h-8" />
              </div>
            )}
          </div>
        </div>

        {/* Action Icon */}
        <div className="absolute top-4 right-6 text-secondary-300 group-hover:text-primary-500 transition-colors">
          <ArrowUpRight className="w-5 h-5" />
        </div>

        {/* Title & Description */}
        <div className="space-y-1">
          <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight leading-none truncate">
            {team.name}
          </h3>
          <p className="text-[11px] text-secondary-500 font-medium line-clamp-2 min-h-[2rem]">
            {team.description || `A strategic power team focused on the ${team.category?.name || 'business'} sector.`}
          </p>
        </div>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-secondary-50 dark:border-secondary-800/50 flex items-center justify-between">
          {/* Member Stack */}
          <div className="flex -space-x-2">
            {recentMembers.filter((m: any) => m.status === 'APPROVED').slice(0, 5).map((member: any) => (
              <Avatar
                key={member.user.id}
                src={member.user.avatar}
                name={member.user.name}
                className="w-7 h-7 ring-2 ring-white dark:ring-secondary-900 shadow-sm rounded-lg"
              />
            ))}
            {memberCount > 5 && (
              <div className="w-7 h-7 rounded-lg bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center text-[9px] font-black text-secondary-500 ring-2 ring-white dark:ring-secondary-900">
                +{memberCount - 5}
              </div>
            )}
            {memberCount === 0 && (
              <div className="flex items-center gap-2 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                <Users className="w-3.5 h-3.5" />
                Empty Team
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
             <div className="text-right">
                <p className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none">{memberCount}</p>
                <p className="text-[8px] font-black text-secondary-400 uppercase tracking-widest leading-none mt-1">Partners</p>
             </div>
             {team.isActive && (
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <ShieldCheck className="w-3.5 h-3.5" />
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Hover Reveal Effect */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary-500 to-violet-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </Link>
  );
}
