'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { DataGrid, DataGridPagination, DataGridToolbar, DataGridColumn, DataGridAction } from '@/components/ui/data-grid';
import {
  Search, User, ShieldCheck,
  Check, Loader2, Globe,
  UserCog, AlertCircle, UserPlus,
  ShieldX, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminUsers, useUpdateUserStatus } from '@/hooks/use-api/use-admin';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';

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
  createdAt: string;
  companyName?: string;
  website?: string;
  websiteLabel?: string;
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Reset page on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resets pagination when filters change
    setPage(1);
  }, [searchQuery, typeFilter]);

  // Queries
  const { data, isLoading: usersLoading, refetch } = useAdminUsers({
    page,
    limit,
    search: searchQuery || undefined,
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
  });

  const users = data?.users || [];

  // Mutations
  const updateUserStatusMutation = useUpdateUserStatus();

  const handleSetUserType = (userId: string, userType: 'INDIVIDUAL' | 'BUSINESS') => {
    updateUserStatusMutation.mutate({ userId, userType });
  };

  const columns: DataGridColumn<AdminUser>[] = [
    {
      key: 'name',
      header: 'User Profile',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.name} className="w-9 h-9 rounded-lg ring-2 ring-secondary-100 dark:ring-secondary-800/40 shadow-sm" />
          <div className="min-w-0">
            <p className="font-bold text-secondary-900 dark:text-white truncate uppercase tracking-tight text-sm leading-none mb-1">{user.name}</p>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-secondary-400 uppercase tracking-wide">
              <span className="text-secondary-500">@{user.username}</span>
              <span className="w-0.5 h-0.5 bg-secondary-300 dark:bg-secondary-700 rounded-full" />
              <span className="truncate opacity-70">{user.email}</span>
            </div>
            {user.companyName && (
              <div className="flex items-center gap-1 mt-1 text-[9px] font-bold text-primary uppercase tracking-wide bg-primary/5 dark:bg-primary/10 w-fit px-1.5 py-0.5 rounded border border-primary/10">
                <Globe className="w-2.5 h-2.5" /> {user.companyName}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'userType',
      header: 'Type',
      sortable: true,
      render: (user) => (
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border",
          user.userType === 'BUSINESS' ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50" :
            user.userType === 'ADMIN' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50" :
              "bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700/50"
        )}>
          {user.userType === 'BUSINESS' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
          {user.userType}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      accessor: (user) => new Date(user.createdAt),
      className: 'font-semibold text-[10px] text-secondary-400 uppercase tracking-tight',
      render: (user) => format(new Date(user.createdAt), 'MMM d, yyyy'),
    },
  ];

  const actions: DataGridAction<AdminUser>[] = [
    {
      key: 'revert',
      icon: ShieldX,
      variant: 'danger',
      title: 'Revert to Individual',
      show: (user) => user.userType === 'BUSINESS',
      disabled: () => updateUserStatusMutation.isPending,
      onClick: (user) => handleSetUserType(user.id, 'INDIVIDUAL'),
    },
    {
      key: 'promote',
      icon: Check,
      variant: 'success',
      title: 'Make Business',
      show: (user) => user.userType === 'INDIVIDUAL',
      disabled: () => updateUserStatusMutation.isPending,
      onClick: (user) => handleSetUserType(user.id, 'BUSINESS'),
    },
    {
      key: 'edit',
      icon: UserCog,
      variant: 'default',
      title: 'Edit Profile',
      onClick: (user) => setEditingUser(user),
    },
  ];

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
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        icon={User}
        title="User"
        accent="Management"
        description="Manage profiles, account types, and monitor platform health"
        actions={
          <button
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-90 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Bulk Onboarding
          </button>
        }
      />

      <BulkImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onRefresh={refetch}
      />

      {/* Filters & Search */}
      <DataGridToolbar
        search={
          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            placeholder="Search users..."
            value={searchQuery}
            clearable
            onClear={() => setSearchQuery('')}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border-none bg-slate-100 dark:bg-slate-800"
          />
        }
        filters={
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
        }
      />

      {/* Users Grid */}
      <DataGrid
        columns={columns}
        data={users}
        loading={usersLoading}
        emptyMessage="Zero Results Found"
        getRowId={(user) => user.id}
        actions={actions}
        footer={
          data && (
            <DataGridPagination
              page={page}
              totalPages={data.pages}
              total={data.total}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
              itemLabel="users"
            />
          )
        }
      />

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
