'use client';

import { PowerTeamCard } from './PowerTeamCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Building } from 'lucide-react';

interface PowerTeamGridProps {
  teams: any[];
  isLoading: boolean;
}

export function PowerTeamGrid({ teams, isLoading }: PowerTeamGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-72 bg-secondary-50 dark:bg-secondary-800/40 rounded-[2.5rem] animate-pulse" />
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-secondary-50 dark:bg-secondary-800/50 flex items-center justify-center text-secondary-200 dark:text-secondary-700 mb-6">
          <Building className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">
          No Power Teams Found
        </h3>
        <p className="text-sm text-secondary-500 max-w-xs mx-auto">
          Be the first to create a strategic alliance in your industry.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {teams.map((team) => (
        <PowerTeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
