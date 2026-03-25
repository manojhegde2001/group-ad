'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, User, ShieldCheck, ShieldAlert, 
  MoreVertical, Check, X, Loader2, Mail, Globe,
  ShieldQuestion, UserCog, AlertCircle, UserPlus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const BulkImportDialog = dynamic(() => import('@/components/admin/BulkImportDialog'), {
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
}

export default function AdminUsersPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, typeFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        toast.error(data.error || 'Failed to fetch users');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (userId: string, status: string, userType?: string) => {
    setProcessingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userType, note: 'Manually updated by Admin' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) return null;
  if (!isAuthenticated || (currentUser as any)?.userType !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase">
            User Management
          </h1>
          <p className="text-secondary-500 font-medium mt-1 uppercase text-xs tracking-widest">
            Manage profiles, handle verifications, and monitor platform activity
          </p>
        </div>
        <button 
          onClick={() => setIsImportOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
        >
           <UserPlus className="w-4 h-4" />
           Bulk Onboarding
        </button>
      </div>

      <BulkImportDialog 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        onRefresh={fetchUsers} 
      />

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-secondary-900 p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <Input 
            placeholder="Search name, username, or email..." 
            className="pl-11 h-12 rounded-2xl bg-secondary-50 dark:bg-secondary-800/50 border-none focus:ring-2 focus:ring-primary-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
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
            className="h-12 !rounded-2xl"
          />
        </div>
        <div className="relative">
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
            className="h-12 !rounded-2xl"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-800 rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">User Details</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">Account Type</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">Verification</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">Joined</th>
                <th className="px-6 py-5 text-right font-black text-[10px] uppercase tracking-widest text-secondary-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                       <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">Searching Users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <ShieldQuestion className="w-12 h-12 text-secondary-200" />
                       <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="group hover:bg-secondary-50/50 dark:hover:bg-secondary-900/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <Avatar src={user.avatar} name={user.name} className="w-12 h-12 rounded-2xl ring-4 ring-secondary-50 dark:ring-secondary-800 shadow-sm" />
                        <div className="min-w-0">
                          <p className="font-black text-secondary-900 dark:text-white truncate uppercase tracking-tight">{user.name}</p>
                          <div className="flex items-center gap-2 text-xs font-bold text-secondary-500">
                             <span>@{user.username}</span>
                             <span className="w-1 h-1 bg-secondary-300 rounded-full" />
                             <span className="truncate">{user.email}</span>
                          </div>
                          {user.companyName && (
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                               <Globe className="w-3 h-3" /> {user.companyName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className={cn(
                         "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                         user.userType === 'BUSINESS' ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800" :
                         user.userType === 'ADMIN' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800" :
                         "bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 border-secondary-200 dark:border-secondary-700"
                       )}>
                          {user.userType === 'BUSINESS' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {user.userType}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <span className={cn(
                         "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                         user.verificationStatus === 'VERIFIED' ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" :
                         user.verificationStatus === 'PENDING' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800" :
                         user.verificationStatus === 'REJECTED' ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800" :
                         "bg-secondary-100 dark:bg-secondary-800 text-secondary-500 border-secondary-200"
                       )}>
                         {user.verificationStatus}
                       </span>
                    </td>
                    <td className="px-6 py-5 font-bold text-xs text-secondary-500">
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {user.verificationStatus !== 'VERIFIED' && (
                           <button 
                             onClick={() => handleManualVerify(user.id, 'VERIFIED', 'BUSINESS')}
                             disabled={!!processingId}
                             className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm"
                             title="Manual Verify (Make Business)"
                           >
                             <ShieldCheck className="w-5 h-5" />
                           </button>
                         )}
                         <button className="p-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 rounded-xl hover:bg-primary-500 hover:text-white transition-all active:scale-95 shadow-sm">
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
      
      {/* Help Section */}
      <div className="flex items-center gap-4 p-6 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/20 rounded-[2rem]">
         <AlertCircle className="w-6 h-6 text-primary-500 shrink-0" />
         <div className="flex-1">
            <p className="text-sm font-bold text-primary-900 dark:text-primary-100 uppercase tracking-tight">Manual Verification Tip</p>
            <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">Manual verification automatically grants the user a BUSINESS type and the verified badge. Use this for VIPs or offline verified businesses.</p>
         </div>
      </div>
    </div>
  );
}
