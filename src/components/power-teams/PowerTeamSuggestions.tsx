'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { ShieldCheck, Zap, ArrowRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CloudinaryImage } from '@/components/ui/cloudinary-image';

interface PowerTeamMate {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  industry: string | null;
  verificationStatus: string;
}

interface PowerTeamSuggestionsProps {
  team: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    members: { user: PowerTeamMate }[];
  };
  viewedUserName: string;
}

export const PowerTeamSuggestions = memo(function PowerTeamSuggestions({ team, viewedUserName }: PowerTeamSuggestionsProps) {
  const teammates = useMemo(() => team.members.map((m) => m.user), [team.members]);

  if (teammates.length === 0) return null;

  return (
    <div className="mt-8 p-6 rounded-[2.5rem] bg-gradient-to-br from-secondary-50 to-white dark:from-secondary-900/50 dark:to-secondary-900 border border-secondary-100 dark:border-secondary-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight">
              Alliance Partners
            </h3>
            <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest mt-0.5 leading-none">
              From {team.name}
            </p>
          </div>
        </div>
        <Link
          href={`/power-teams/${team.slug}`}
          className="group flex items-center gap-1 text-[9px] font-black text-primary-500 uppercase tracking-widest hover:text-primary-600 transition-colors"
        >
          View
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Team Badge */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-700/50 mb-5">
         {team.logo ? (
           <div className="w-6 h-6 rounded-lg overflow-hidden relative">
             <CloudinaryImage src={team.logo} alt={team.name} fill className="object-cover" />
           </div>
         ) : (
          <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-primary-500" />
          </div>
        )}
        <p className="text-[10px] font-black text-secondary-600 dark:text-secondary-300 uppercase tracking-widest truncate">
          {viewedUserName}'s Power Team
        </p>
      </div>

      {/* Teammates List */}
      <div className="space-y-3">
        {teammates.map((teammate) => (
          <Link
            key={teammate.id}
            href={`/profile/${teammate.username}`}
            className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white dark:hover:bg-secondary-800/60 border border-transparent hover:border-secondary-100 dark:hover:border-secondary-700/50 hover:shadow-sm transition-all duration-200"
          >
            <div className="relative shrink-0">
              <Avatar
                src={teammate.avatar ?? undefined}
                name={teammate.name}
                className="w-10 h-10 rounded-xl ring-2 ring-transparent group-hover:ring-primary-500/20 transition-all"
              />
              {teammate.verificationStatus === 'VERIFIED' && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white dark:bg-secondary-900 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate group-hover:text-primary-500 transition-colors">
                {teammate.name}
              </p>
              <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest truncate mt-0.5">
                {teammate.industry || 'Business Partner'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
});
