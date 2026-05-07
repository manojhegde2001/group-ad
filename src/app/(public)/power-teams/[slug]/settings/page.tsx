'use client';

import { useParams, useRouter } from 'next/navigation';
import { usePowerTeam } from '@/hooks/use-api/use-power-teams';
import { useAuth } from '@/hooks/use-auth';
import { TeamSettingsForm } from '@/components/power-teams/TeamSettingsForm';
import { Loader2, ArrowLeft, ShieldAlert, Settings as SettingsIcon } from 'lucide-react';
import { Button } from 'rizzui';
import Link from 'next/link';

export default function PowerTeamSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading: teamLoading } = usePowerTeam(slug);
  const team = data?.team;

  const isLoading = authLoading || teamLoading;

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-white dark:bg-secondary-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Initialising Settings...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-[2rem] bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Alliance Not Found</h1>
        <Link href="/power-teams" className="mt-8 text-primary-500 font-black uppercase tracking-widest text-xs hover:underline">
          Back to all teams
        </Link>
      </div>
    );
  }

  // Authorization check
  const isCreator = team.creatorId === user?.id;
  const isAdmin = (user as any)?.userType === 'ADMIN';

  if (!isCreator && !isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-20 h-20 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 flex items-center justify-center text-amber-500 mb-6">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Access Denied</h1>
        <p className="text-secondary-500 mt-2 max-w-sm">Only the alliance founder or system administrators can manage these settings.</p>
        <Button 
          variant="text" 
          onClick={() => router.back()}
          className="mt-8 font-black uppercase tracking-widest text-xs"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-secondary-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12">
            <Link 
                href={`/power-teams/${slug}`}
                className="group flex items-center gap-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition-colors"
            >
                <div className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-900 group-hover:bg-secondary-100 dark:group-hover:bg-secondary-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Profile</span>
            </Link>

            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900">
                    <SettingsIcon className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">Alliance Settings</h1>
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest leading-none mt-0.5">{team.name}</p>
                </div>
            </div>
        </div>

        {/* Form Container */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <TeamSettingsForm team={team} />
        </div>

      </div>
    </main>
  );
}
