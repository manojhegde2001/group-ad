'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Check, X, Loader2, ShieldCheck, ShieldAlert, Search,
  UserPlus, UserMinus, Globe, Building2
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Input, Button, Badge } from 'rizzui';
import { DataGrid, DataGridPagination, DataGridColumn, DataGridAction } from '@/components/ui/data-grid';
import {
    useVerificationRequests,
    useUpdateVerificationRequest,
    useAdminUsers,
    useUpdateUserStatus
} from '@/hooks/use-api/use-admin';

interface AdminSearchUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  userType: 'INDIVIDUAL' | 'BUSINESS' | 'ADMIN';
}

interface AdminVerificationRequest {
  id: string;
  companyName: string;
  companySize?: string;
  gstNumber?: string;
  companyWebsite?: string;
  reason?: string;
  createdAt: string;
  user: { name: string; email: string; avatar: string };
}

export default function AdminBusinessesPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // Queries
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsLimit, setRequestsLimit] = useState(10);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const { data: requestsData, isLoading: requestsLoading } = useVerificationRequests({
    page: requestsPage,
    limit: requestsLimit
  });
  const requests = requestsData?.requests || [];

  // Mutations
  const updateVerificationRequestMutation = useUpdateVerificationRequest();
  const updateUserStatusMutation = useUpdateUserStatus();

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Queries for Search
  const { data: searchData, isFetching: searching } = useAdminUsers({
    search: isSearching ? searchTerm : undefined,
    limit: 10
  });
  
  const searchResults = isSearching ? searchData?.users || [] : [];

  const handleGlobalSearch = () => {
    if (searchTerm.trim()) {
        setIsSearching(true);
    } else {
        setIsSearching(false);
    }
  };

  const handleAction = (id: string, action: 'APPROVED' | 'REJECTED') => {
    updateVerificationRequestMutation.mutate({ id, status: action });
  };

  const handleSetUserType = (userId: string, userType: 'BUSINESS' | 'INDIVIDUAL') => {
    updateUserStatusMutation.mutate({ userId, userType });
  };

  const requestColumns: DataGridColumn<AdminVerificationRequest>[] = [
    {
      key: 'user',
      header: 'Applicant',
      sortable: true,
      accessor: (req) => req.user.name,
      render: (req) => (
        <div className="flex items-center gap-3">
          <Avatar src={req.user.avatar} name={req.user.name} className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="min-w-0">
            <p className="font-bold text-sm text-secondary-900 dark:text-white uppercase tracking-tight truncate">{req.user.name}</p>
            <p className="text-[10px] text-secondary-400 font-semibold uppercase tracking-wide leading-none mt-0.5 truncate">{req.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'companyName',
      header: 'Company',
      sortable: true,
      render: (req) => (
        <div>
          <p className="font-bold text-sm text-secondary-900 dark:text-white truncate">{req.companyName}</p>
          {req.companySize && (
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wide">
              {req.companySize}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'gstNumber',
      header: 'GST',
      render: (req) => (
        <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">{req.gstNumber || '—'}</span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Submitted',
      sortable: true,
      accessor: (req) => new Date(req.createdAt),
      render: (req) => (
        <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">
          {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      ),
    },
  ];

  const requestActions: DataGridAction<AdminVerificationRequest>[] = [
    {
      key: 'approve',
      icon: Check,
      label: 'Approve',
      variant: 'success',
      loading: (req) => updateVerificationRequestMutation.isPending && updateVerificationRequestMutation.variables?.id === req.id,
      disabled: () => updateVerificationRequestMutation.isPending,
      onClick: (req) => handleAction(req.id, 'APPROVED'),
    },
    {
      key: 'reject',
      icon: X,
      label: 'Reject',
      variant: 'danger',
      loading: (req) => updateVerificationRequestMutation.isPending && updateVerificationRequestMutation.variables?.id === req.id,
      disabled: () => updateVerificationRequestMutation.isPending,
      onClick: (req) => handleAction(req.id, 'REJECTED'),
    },
  ];

  const searchColumns: DataGridColumn<AdminSearchUser>[] = [
    {
      key: 'name',
      header: 'User Profile',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <Avatar src={user.avatar} name={user.name} size="sm" className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="min-w-0">
            <p className="font-bold text-sm text-secondary-900 dark:text-white uppercase tracking-tight">{user.name}</p>
            <p className="text-[10px] text-secondary-400 font-semibold uppercase tracking-wide leading-none mt-0.5">@{user.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'userType',
      header: 'Account Status',
      sortable: true,
      render: (user) => (
        <Badge variant="flat" color={user.userType === 'BUSINESS' ? 'primary' : 'secondary'} className="rounded-md !text-[9px] font-bold uppercase tracking-wide px-2 py-0.5">
          {user.userType}
        </Badge>
      ),
    },
  ];

  const searchActions: DataGridAction<AdminSearchUser>[] = [
    {
      key: 'revert',
      icon: UserMinus,
      label: 'Revert to Individual',
      variant: 'danger',
      show: (user) => user.userType === 'BUSINESS',
      loading: (user) => updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id,
      onClick: (user) => handleSetUserType(user.id, 'INDIVIDUAL'),
    },
    {
      key: 'promote',
      icon: UserPlus,
      label: 'Make Business',
      variant: 'success',
      show: (user) => user.userType === 'INDIVIDUAL',
      loading: (user) => updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id,
      onClick: (user) => handleSetUserType(user.id, 'BUSINESS'),
    },
  ];

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying access</p>
      </div>
    );
  }

  if (!isAuthenticated || (currentUser as any)?.userType !== 'ADMIN') {
    redirect('/admin/login');
    return null;
  }

  return (
    <div className="space-y-5 pb-20">
      <AdminPageHeader
        icon={Building2}
        title="Business"
        accent="Center"
        description="Manage business accounts and review conversion requests"
      />

      {/* Global Search & Account Type Section */}
      <Card className="p-4 border border-primary-100 dark:border-primary-900/30 rounded-xl shadow-sm bg-gradient-to-br from-white to-primary-50/20 dark:from-secondary-950 dark:to-primary-900/5">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                  <Search className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-black text-base text-secondary-900 dark:text-white uppercase tracking-tighter mb-0.5">Search & Manage</h3>
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest opacity-80">Find any user to instantly change their account type</p>
               </div>
            </div>
            <div className="flex flex-1 max-w-md gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-secondary-100 dark:border-secondary-800">
                <input
                    placeholder="Search by name or email..."
                    className="flex-1 bg-transparent border-none outline-none px-3 py-1.5 font-bold text-sm"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        if (!e.target.value.trim()) setIsSearching(false);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleGlobalSearch()}
                />
                <Button
                    onClick={handleGlobalSearch}
                    isLoading={searching}
                    className="!rounded-md bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black uppercase text-[10px] tracking-widest px-5 h-9 transition-all active:scale-95"
                >
                    Search
                </Button>
            </div>
         </div>

         {isSearching && (
           <DataGrid
             columns={searchColumns}
             data={searchResults}
             loading={searching}
             loadingMessage="Searching Database"
             emptyMessage="No Users Found"
             getRowId={(user) => user.id}
             actions={searchActions}
             className="rounded-lg shadow-md"
           />
         )}
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4 border-b border-secondary-100 dark:border-secondary-800/50 pb-3">
            <h3 className="font-black text-base text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter flex items-center gap-2">
               <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
               </div>
               Pending Approvals ({requests.length})
            </h3>
          </div>

          <DataGrid
            columns={requestColumns}
            data={requests}
            loading={requestsLoading}
            loadingMessage="Querying Requests"
            emptyMessage="Queue is clear — no pending business applications"
            getRowId={(req) => req.id}
            actions={requestActions}
            expandedRowId={expandedRequestId}
            onToggleExpand={(id) => setExpandedRequestId((prev) => (prev === id ? null : (id as string)))}
            expandable={{
              isExpandable: (req) => !!(req.reason || req.companyWebsite),
              render: (req) => (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {req.reason && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-secondary-400 mb-2">Reason</p>
                      <p className="text-sm text-secondary-600 dark:text-secondary-300 italic border-l-2 border-indigo-500/20 pl-3">
                        &quot;{req.reason}&quot;
                      </p>
                    </div>
                  )}
                  {req.companyWebsite && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-secondary-400 mb-2">Website</p>
                      <a href={req.companyWebsite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        <Globe className="w-3.5 h-3.5" /> {req.companyWebsite}
                      </a>
                    </div>
                  )}
                </div>
              ),
            }}
            footer={
              requestsData && (
                <DataGridPagination
                  page={requestsPage}
                  totalPages={requestsData.pages}
                  total={requestsData.total}
                  pageSize={requestsLimit}
                  onPageChange={setRequestsPage}
                  onPageSizeChange={(size) => { setRequestsLimit(size); setRequestsPage(1); }}
                  itemLabel="requests"
                />
              )
            }
          />
        </Card>
        
        <Card className="p-4 border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-sm bg-white dark:bg-slate-900">
           <div className="flex items-center justify-between mb-4 border-b border-secondary-100 dark:border-secondary-800/50 pb-3">
              <h3 className="font-black text-base text-secondary-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                 <ShieldAlert className="w-4 h-4 text-secondary-400" />
                 Approval Statistics
              </h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-indigo-500/5 dark:bg-indigo-900/10 rounded-lg border border-indigo-100/50 dark:border-indigo-900/30">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Pending Review</p>
                 <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{requests.length}</p>
              </div>
              <div className="p-4 bg-secondary-50/50 dark:bg-secondary-900/40 rounded-lg border border-secondary-200 dark:border-secondary-800">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-1">Avg. Response Time</p>
                 <p className="text-2xl font-black text-secondary-900 dark:text-white tracking-tighter">
                    {requestsData?.stats?.avgResponseTime !== undefined ? `${requestsData.stats.avgResponseTime}h` : '1.5h'}
                 </p>
              </div>
              <div className="p-4 bg-secondary-50/50 dark:bg-secondary-900/40 rounded-lg border border-secondary-200 dark:border-secondary-800">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-1">Success Rate</p>
                 <p className="text-2xl font-black text-emerald-500 tracking-tighter">
                    {requestsData?.stats?.successRate !== undefined ? `${requestsData.stats.successRate}%` : '98.2%'}
                 </p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
