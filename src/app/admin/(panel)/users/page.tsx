'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import {
  Search, User, ShieldCheck, ShieldAlert,
  Check, X, Loader2, Globe,
  ShieldQuestion, UserCog, AlertCircle, UserPlus,
  ShieldX, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/use-api/use-admin';

const BulkImportDialog = dynamic(() => import('@/components/admin/BulkImportDialog'), {
  ssr: false,
  loading: () => null
});

const UserEditModal = dynamic(() => import('@/components/admin/UserEditModal'), {
  ssr: false,
  loading: () => null
});

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  userType: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  companyName?: string;
  industry?: string;
  website?: string;
  websiteLabel?: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Queries
  const { data, isLoading: usersLoading, refetch } = useAdminUsers({
    search: searchQuery || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined
  });
  
  const users = data?.users || [];

  // Mutations
  const updateUserStatusMutation = useUpdateUserStatus();

  const handleManualVerify = (userId: string, status: string, userType?: string) => {
    updateUserStatusMutation.mutate({ userId, status });
  };

  if (authLoading) return null;
  if (!isAuthenticated || (currentUser as any)?.userType !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying access</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            User <span className="text-primary italic">Management</span>
          </h1>
          <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest leading-none">
            Manage profiles, hande verifications, and monitor platform health
          </p>
        </div>
        <button
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2.5 px-7 py-3.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl active:scale-90 transition-all hover:-translate-y-1"
        >
          <UserPlus className="w-4 h-4" />
          Bulk Onboarding
        </button>
      </div>

      <BulkImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onRefresh={refetch}
      />

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800 shadow-sm backdrop-blur-xl">
        <div className="md:col-span-2">
          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search users..."
            value={searchQuery}
            clearable
            onClear={() => setSearchQuery('')}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl border-none bg-slate-100 dark:bg-slate-800"
          />
        </div>
        <div>
          <Select
            placeholder="Filter Type"
            options={[
              { label: 'All Types', value: 'ALL' },
              { label: 'Individuals', value: 'INDIVIDUAL' },
              { label: 'Businesses', value: 'BUSINESS' },
              { label: 'Admins', value: 'ADMIN' },
            ]}
            value={typeFilter}
            onChange={(val: string) => setTypeFilter(val)}
          />
        </div>
        <div>
          <Select
            placeholder="Filter Status"
            options={[
              { label: 'All Status', value: 'ALL' },
              { label: 'Unverified', value: 'UNVERIFIED' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Verified', value: 'VERIFIED' },
              { label: 'Rejected', value: 'REJECTED' },
            ]}
            value={statusFilter}
            onChange={(val: string) => setStatusFilter(val)}
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-900/40 rounded-[3rem] shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50/50 dark:bg-secondary-800/20 border-b border-secondary-100 dark:border-secondary-800">
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">User Profile</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Type</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Status</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Joined</th>
                <th className="px-8 py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800/50">
              {usersLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">Querying Database</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <ShieldQuestion className="w-16 h-16 text-secondary-200" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">Zero Results Found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="group hover:bg-secondary-50/30 dark:hover:bg-secondary-800/20 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <Avatar src={user.avatar} name={user.name} className="w-12 h-12 rounded-[1.25rem] ring-4 ring-secondary-50 dark:ring-secondary-800/40 shadow-sm transition-transform duration-500 group-hover:scale-110" />
                        <div className="min-w-0">
                          <p className="font-black text-secondary-900 dark:text-white truncate uppercase tracking-tight text-base leading-none mb-1.5">{user.name}</p>
                          <div className="flex items-center gap-2 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                            <span className="text-secondary-500">@{user.username}</span>
                            <span className="w-1 h-1 bg-secondary-200 dark:bg-secondary-800 rounded-full" />
                            <span className="truncate opacity-60 font-bold">{user.email}</span>
                          </div>
                          {user.companyName && (
                            <div className="flex items-center gap-1.5 mt-2 text-[9px] font-black text-primary uppercase tracking-[0.15em] bg-primary/5 dark:bg-primary/10 w-fit px-2 py-0.5 rounded-md border border-primary/10">
                              <Globe className="w-3 h-3" /> {user.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                        user.userType === 'BUSINESS' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50" :
                          user.userType === 'ADMIN' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
                            "bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700/50"
                      )}>
                        {user.userType === 'BUSINESS' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {user.userType}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                        user.verificationStatus === 'VERIFIED' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50" :
                          user.verificationStatus === 'PENDING' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
                            user.verificationStatus === 'REJECTED' ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50" :
                              "bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-100 dark:border-slate-800/50"
                      )}>
                        {user.verificationStatus}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-[10px] text-secondary-400 uppercase tracking-tight">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        {user.verificationStatus === 'VERIFIED' ? (
                          <button
                            onClick={() => handleManualVerify(user.id, 'UNVERIFIED', user.userType)}
                            disabled={updateUserStatusMutation.isPending}
                            className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm border border-red-100 dark:border-red-800/50"
                            title="Revoke Verification"
                          >
                            <ShieldX className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleManualVerify(user.id, 'VERIFIED', 'BUSINESS')}
                            disabled={updateUserStatusMutation.isPending}
                            className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90 shadow-sm border border-emerald-100 dark:border-emerald-800/50"
                            title="Verify Account"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => setEditingUser(user)}
                          className="p-3 bg-secondary-50 dark:bg-secondary-800/40 text-secondary-500 dark:text-secondary-400 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm border border-secondary-100 dark:border-secondary-800/50"
                          title="Edit Profile"
                        >
                          <UserCog className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help Alert */}
      <div className="p-8 bg-primary/5 dark:bg-primary/10 border-2 border-primary/10 dark:border-primary/5 rounded-[3rem] shadow-xl shadow-primary/5 flex items-start gap-6">
        <div className="p-4 bg-primary/10 rounded-[1.5rem] text-primary shadow-inner">
            <AlertCircle className="w-8 h-8" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-black text-primary uppercase tracking-tighter mb-1">Administrative Protocol</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-2xl">
            Manual verification should only be performed for pre-vetted business partners or known community contributors. This action bypasses the standard verification workflow and immediately issues a <span className="text-primary underline decoration-primary/30">BUSINESS</span>-tier credential.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-primary">
            <span className="text-[10px] font-black uppercase tracking-widest">Protocol Docs</span>
            <ArrowRight className="w-4 h-4" />
        </div>
      </div>

      {/* User Edit Modal */}
      <UserEditModal 
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
      />
    </div>
  );
}
