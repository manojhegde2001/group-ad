'use client';

import { useState } from 'react';
import { PowerTeamGrid } from '@/components/power-teams/PowerTeamGrid';
import { CreateTeamModal } from '@/components/power-teams/CreateTeamModal';
import { usePowerTeams } from '@/hooks/use-api/use-power-teams';
import { usePowerTeamModal } from '@/hooks/use-power-teams';
import { useCategories } from '@/hooks/use-api/use-categories';
import { useAuth } from '@/hooks/use-auth';
import { Button } from 'rizzui';
import { Plus, Building, Filter, Search, Zap, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PowerTeamsPage() {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useAuth();
  const { open: openCreateModal } = usePowerTeamModal();
  const { data: catData } = useCategories();
  const categories = catData?.categories || [];

  const { data: teamsData, isLoading } = usePowerTeams({
    categoryId: categoryId || undefined,
    search: searchQuery || undefined,
  });

  const teams = teamsData?.teams || [];

  const isBusiness = (user as any)?.userType === 'BUSINESS';
  const isVerified = (user as any)?.verificationStatus === 'VERIFIED';
  const isAdmin = (user as any)?.userType === 'ADMIN';
  const canCreate = isAdmin || (isBusiness && isVerified);

  return (
    <main className="min-h-screen bg-white dark:bg-secondary-950 pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
               <Zap className="w-3.5 h-3.5 fill-current" />
               Strategic Alliances
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
               Power <span className="text-primary-500 italic">Teams</span>
            </h1>
            
            <p className="max-w-2xl text-base sm:text-lg text-secondary-500 font-medium leading-relaxed">
               Connect with non-competing business partners who share your target market. 
               Build a referral engine that scales your business.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
               {canCreate ? (
                 <Button
                   onClick={openCreateModal}
                   className="h-14 px-10 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95"
                 >
                    <Plus className="w-5 h-5 mr-2" />
                    Initialize Team
                 </Button>
               ) : (
                 <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800/40 border border-secondary-100 dark:border-secondary-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Verified Business Only</span>
                 </div>
               )}
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-12 relative z-20">
        <div className="bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border border-secondary-100 dark:border-secondary-800 rounded-[3rem] p-6 sm:p-10 shadow-2xl">
          
          {/* Controls */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-12">
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <button
                  onClick={() => setCategoryId(null)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    !categoryId 
                      ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 shadow-lg" 
                      : "bg-secondary-50 dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                  )}
                >
                  All Hubs
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      categoryId === cat.id 
                        ? "bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 shadow-lg" 
                        : "bg-secondary-50 dark:bg-secondary-800 text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
             </div>

             <div className="relative w-full lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                <input
                  type="text"
                  placeholder="Search power teams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 outline-none focus:ring-2 ring-primary-500/20 text-sm font-bold transition-all"
                />
             </div>
          </div>

          <PowerTeamGrid teams={teams} isLoading={isLoading} />
        </div>
      </section>

      <CreateTeamModal />
    </main>
  );
}
