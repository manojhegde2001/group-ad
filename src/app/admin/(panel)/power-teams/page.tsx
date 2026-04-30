'use client';

import { useState } from 'react';
import { useAdminPowerTeams } from '@/hooks/use-api/use-admin';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { 
  Search, Building, Users, ShieldCheck, 
  ChevronLeft, ChevronRight, Loader2, 
  Globe, Lock, MoreVertical, ExternalLink,
  Trash2, Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminPowerTeamsPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminPowerTeams({
    page,
    limit: 20,
    search: searchQuery || undefined,
  });

  const teams = data?.teams || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  if (authLoading) return null;
  if (!isAuthenticated || (currentUser as any)?.userType !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            Power Team <span className="text-primary-500 italic">Moderation</span>
          </h1>
          <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest leading-none">
            Monitor strategic alliances and manage team memberships
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-secondary-900 p-6 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <Input
            placeholder="Search teams by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 rounded-2xl border-none bg-secondary-50 dark:bg-secondary-800"
          />
        </div>
      </div>

      {/* Teams Table */}
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-900/40 rounded-[3rem] shadow-sm bg-white dark:bg-secondary-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50/50 dark:bg-secondary-800/20 border-b border-secondary-100 dark:border-secondary-800">
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Team Info</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Creator</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Industry</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Members</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Status</th>
                <th className="px-8 py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500 mx-auto" />
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <p className="text-secondary-400 font-black uppercase text-[10px] tracking-widest">No teams found</p>
                  </td>
                </tr>
              ) : (
                teams.map((team: any) => (
                  <tr key={team.id} className="group hover:bg-secondary-50/30 dark:hover:bg-secondary-800/20 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center overflow-hidden border border-secondary-100 dark:border-secondary-700">
                          {team.logo ? <img src={team.logo} className="w-full h-full object-cover" /> : <Building className="w-6 h-6 text-secondary-300" />}
                        </div>
                        <div>
                          <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight text-sm leading-none mb-1">{team.name}</p>
                          <div className="flex items-center gap-2">
                             {team.visibility === 'PUBLIC' ? <Globe className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-amber-500" />}
                             <span className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{team.visibility} Alliance</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <Avatar src={team.creator?.avatar} name={team.creator?.name} size="sm" className="rounded-lg" />
                         <span className="text-xs font-bold text-secondary-700 dark:text-secondary-300">@{team.creator?.username}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 rounded-lg bg-secondary-50 dark:bg-secondary-800 text-[9px] font-black text-secondary-500 uppercase tracking-widest border border-secondary-100 dark:border-secondary-700">
                          {team.category?.name}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 font-black text-xs text-secondary-900 dark:text-white">
                          <Users className="w-4 h-4 text-secondary-400" />
                          {team._count?.members || 0}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className={cn(
                         "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                         team.isActive ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50"
                       )}>
                         {team.isActive ? 'Active' : 'Inactive'}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <Link href={`/power-teams/${team.slug}`} target="_blank">
                             <button className="p-2.5 rounded-xl bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-primary-500 border border-secondary-100 dark:border-secondary-700 transition-all active:scale-90 shadow-sm">
                                <ExternalLink className="w-4 h-4" />
                             </button>
                          </Link>
                          <button className="p-2.5 rounded-xl bg-secondary-50 dark:bg-secondary-800 text-secondary-400 hover:text-amber-500 border border-secondary-100 dark:border-secondary-700 transition-all active:scale-90 shadow-sm">
                             <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-400 hover:text-red-600 border border-red-100 dark:border-red-900/20 transition-all active:scale-90 shadow-sm">
                             <Trash2 className="w-4 h-4" />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-8 py-6 bg-secondary-50/30 dark:bg-secondary-800/10 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between">
             <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                Showing {teams.length} of {pagination.total} Teams
             </p>
             <div className="flex items-center gap-2">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-secondary-100 dark:border-secondary-700 disabled:opacity-30"
                >
                   <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-secondary-900 dark:text-white px-2">{page} / {pagination.totalPages}</span>
                <button 
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-lg border border-secondary-100 dark:border-secondary-700 disabled:opacity-30"
                >
                   <ChevronRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
}
