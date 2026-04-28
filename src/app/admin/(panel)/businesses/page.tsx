'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { 
  Check, X, Loader2, Building2, User, Calendar, Globe, 
  MapPin, ShieldCheck, ShieldAlert, Search,
  UserPlus, UserMinus, ShieldQuestion, ArrowRight,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Input, Button, Badge } from 'rizzui';
import { 
    useVerificationRequests, 
    useUpdateVerificationRequest,
    useAdminUsers,
    useUpdateUserStatus
} from '@/hooks/use-api/use-admin';

export default function AdminBusinessesPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  
  // Queries
  const [requestsPage, setRequestsPage] = useState(1);
  const { data: requestsData, isLoading: requestsLoading } = useVerificationRequests({
    page: requestsPage,
    limit: 10
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

  const handleManualVerify = (userId: string, targetStatus: 'VERIFIED' | 'UNVERIFIED') => {
    updateUserStatusMutation.mutate({ 
        userId, 
        status: targetStatus === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED' 
    });
  };

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
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            Business <span className="text-primary italic">Center</span>
          </h1>
          <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest leading-none">
            Verify professionals, manage business profiles, and handle requests
          </p>
        </div>
      </div>

      {/* Global Search & Verify Section */}
      <Card className="p-8 border-2 border-primary-100 dark:border-primary-900/30 rounded-[3rem] shadow-sm bg-gradient-to-br from-white to-primary-50/20 dark:from-secondary-950 dark:to-primary-900/5 backdrop-blur-xl">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                  <Search className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="font-black text-xl text-secondary-900 dark:text-white uppercase tracking-tighter mb-1">Search & Verify</h3>
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest opacity-80">Find any user to instantly manage verification</p>
               </div>
            </div>
            <div className="flex flex-1 max-w-md gap-3 bg-white dark:bg-slate-900 p-2 rounded-[2rem] shadow-xl shadow-primary/5">
                <input 
                    placeholder="Search by name or email..." 
                    className="flex-1 bg-transparent border-none outline-none px-4 py-2 font-bold text-sm"
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
                    className="!rounded-2xl bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black uppercase text-[10px] tracking-widest px-6 h-10 transition-all hover:scale-105 active:scale-95"
                >
                    Search
                </Button>
            </div>
         </div>

         {isSearching && (
           <div className="border-2 border-secondary-50 dark:border-secondary-800 rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-secondary-50/50 dark:bg-secondary-800/20 border-b border-secondary-50 dark:border-secondary-800">
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">User Profile</th>
                          <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Account Status</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800/40">
                       {searching ? (
                           <tr>
                               <td colSpan={3} className="px-8 py-20 text-center">
                                   <div className="flex flex-col items-center gap-4">
                                       <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                       <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em]">Searching Database</p>
                                   </div>
                               </td>
                           </tr>
                       ) : searchResults.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4 opacity-40">
                                        <ShieldQuestion className="w-12 h-12 text-secondary-300" />
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em]">No Users Found</p>
                                    </div>
                                </td>
                            </tr>
                       ) : (
                        searchResults.map((user) => (
                           <tr key={user.id} className="hover:bg-secondary-50/30 dark:hover:bg-secondary-800/10 transition-colors group">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <Avatar src={user.avatar} name={user.name} size="sm" className="w-11 h-11 rounded-[1.25rem] shadow-sm transform transition-transform group-hover:scale-110" />
                                    <div className="min-w-0">
                                       <p className="font-black text-sm text-secondary-900 dark:text-white uppercase tracking-tight">{user.name}</p>
                                       <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest leading-none mt-1">@{user.username}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex gap-2">
                                    <Badge variant="flat" color={user.userType === 'BUSINESS' ? 'primary' : 'secondary'} className="rounded-[10px] !text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                       {user.userType}
                                    </Badge>
                                    <Badge variant="flat" color={user.verificationStatus === 'VERIFIED' ? 'success' : 'secondary'} className="rounded-[10px] !text-[9px] font-black uppercase tracking-widest px-2.5 py-1">
                                       {user.verificationStatus}
                                    </Badge>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                    {user.verificationStatus === 'VERIFIED' ? (
                                        <Button 
                                            size="sm" 
                                            color="danger" 
                                            variant="flat" 
                                            onClick={() => handleManualVerify(user.id, 'UNVERIFIED')}
                                            isLoading={updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id}
                                            className="!rounded-[1.25rem] font-black !text-[10px] uppercase tracking-widest h-10 px-6 active:scale-90"
                                        >
                                            <UserMinus className="w-3.5 h-3.5 mr-2" />
                                            Revoke
                                        </Button>
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            variant="solid" 
                                            onClick={() => handleManualVerify(user.id, 'VERIFIED')}
                                            isLoading={updateUserStatusMutation.isPending && updateUserStatusMutation.variables?.userId === user.id}
                                            className="!rounded-[1.25rem] font-black !text-[10px] uppercase tracking-widest bg-emerald-500 hover:bg-emerald-600 text-white h-10 px-6 active:scale-90 shadow-lg shadow-emerald-500/20"
                                        >
                                            <UserPlus className="w-3.5 h-3.5 mr-2" />
                                            Verify
                                        </Button>
                                    )}
                                 </div>
                              </td>
                           </tr>
                        ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
         )}
      </Card>

      <div className="grid grid-cols-1 gap-8">
        <Card className="p-10 border-2 border-secondary-50 dark:border-secondary-800 rounded-[3.5rem] shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-10 border-b border-secondary-50 dark:border-secondary-800/50 pb-8">
            <h3 className="font-black text-xl text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter flex items-center gap-3">
               <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl shadow-inner">
                  <ShieldCheck className="w-7 h-7" />
               </div>
               Pending Approvals ({requests.length})
            </h3>
          </div>

          {requestsLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
               <div className="w-14 h-14 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin shadow-lg shadow-indigo-500/10" />
               <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">Querying Requests</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-32 bg-secondary-50/30 dark:bg-secondary-800/10 rounded-[3rem] border-4 border-dashed border-secondary-100 dark:border-secondary-800 flex flex-col items-center justify-center gap-6">
               <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-2xl shadow-secondary-500/5">
                  <Building2 className="w-10 h-10 text-secondary-200" />
               </div>
               <div>
                  <p className="text-secondary-700 dark:text-secondary-300 font-black uppercase text-xs tracking-widest mb-1">Queue is Clear</p>
                  <p className="text-[10px] text-secondary-400 font-bold uppercase tracking-widest mt-1 opacity-70">No pending business applications</p>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="group relative flex flex-col xl:flex-row xl:items-center justify-between p-8 bg-secondary-50/50 dark:bg-secondary-800/20 border-2 border-transparent hover:border-indigo-500/20 rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/5 active:scale-[0.99]"
                >
                  <div className="flex items-start gap-8 flex-1 min-w-0">
                    <Avatar 
                      src={req.user.avatar} 
                      name={req.user.name} 
                      className="w-20 h-20 rounded-[2rem] ring-8 ring-white dark:ring-secondary-800 shadow-xl shrink-0 transition-transform duration-500 group-hover:scale-105" 
                    />
                    <div className="flex-1 min-w-0 pt-1">
                       <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-black text-2xl text-secondary-900 dark:text-white truncate tracking-tight">
                            {req.companyName}
                          </h4>
                          <span className="px-4 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-xl uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                            {req.industry || 'VERIFY'}
                          </span>
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                          <div className="flex items-center gap-2 text-[11px] font-black text-secondary-500 uppercase tracking-widest">
                             <User className="w-4 h-4 text-indigo-400" />
                             {req.user.name} <span className="text-secondary-300 ml-1">(@{req.user.email.split('@')[0]})</span>
                          </div>
                          {req.gstNumber && (
                             <div className="flex items-center gap-2 text-[11px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-xl">
                               <ShieldCheck className="w-4 h-4" />
                               GST: {req.gstNumber}
                             </div>
                          )}
                          <div className="flex items-center gap-2 text-[11px] font-black text-secondary-400 uppercase tracking-widest">
                             <Calendar className="w-4 h-4" />
                             {new Date(req.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </div>
                       </div>

                       {req.reason && (
                         <div className="mt-5 relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20 rounded-full" />
                            <p className="pl-6 text-sm text-secondary-500 dark:text-secondary-400 italic font-medium leading-relaxed">
                              "{req.reason}"
                            </p>
                         </div>
                       )}
                       
                       <div className="flex flex-wrap items-center gap-6 mt-6">
                          {req.companyWebsite && (
                             <a href={req.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] group/link">
                               <Globe className="w-4 h-4 transition-transform group-hover/link:rotate-12" /> Website <ArrowRight className="w-3.5 h-3.5 -ml-1 opacity-0 group-hover/link:opacity-100 transition-all translate-x-0 group-hover/link:translate-x-1" />
                             </a>
                          )}
                          {req.companySize && (
                             <span className="flex items-center gap-2 text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] opacity-80">
                               <MapPin className="w-4 h-4" /> Size: {req.companySize}
                             </span>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-8 xl:mt-0 xl:pl-10 shrink-0">
                    <button 
                      onClick={() => handleAction(req.id, 'APPROVED')}
                      disabled={updateVerificationRequestMutation.isPending}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] shadow-2xl shadow-emerald-500/20 active:scale-90 transition-all disabled:opacity-50 h-14"
                    >
                      {updateVerificationRequestMutation.isPending && updateVerificationRequestMutation.variables?.id === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'REJECTED')}
                      disabled={updateVerificationRequestMutation.isPending}
                      className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-secondary-800 text-red-500 border-2 border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 font-black text-xs uppercase tracking-[0.2em] rounded-[1.75rem] active:scale-95 transition-all disabled:opacity-50 h-14"
                    >
                      {updateVerificationRequestMutation.isPending && updateVerificationRequestMutation.variables?.id === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requests Pagination */}
          {requestsData && requestsData.pages > 1 && (
            <div className="mt-10 px-8 py-6 bg-secondary-50/30 dark:bg-secondary-800/10 border-t border-secondary-100 dark:border-secondary-800 rounded-b-[2.5rem] flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                Showing <span className="text-secondary-900 dark:text-white">{(requestsPage - 1) * 10 + 1}</span> to <span className="text-secondary-900 dark:text-white">{Math.min(requestsPage * 10, requestsData.total)}</span> of <span className="text-secondary-900 dark:text-white">{requestsData.total}</span> requests
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRequestsPage(p => Math.max(1, p - 1))}
                  disabled={requestsPage === 1}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-secondary-700 text-secondary-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRequestsPage(p => Math.min(requestsData.pages, p + 1))}
                  disabled={requestsPage === requestsData.pages}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-secondary-700 text-secondary-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </Card>
        
        <Card className="p-10 border-2 border-secondary-50 dark:border-secondary-800 rounded-[3.5rem] shadow-sm bg-white dark:bg-slate-900">
           <div className="flex items-center justify-between mb-10 border-b border-secondary-50 dark:border-secondary-800/50 pb-8">
              <h3 className="font-black text-xl text-secondary-900 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                 <ShieldAlert className="w-7 h-7 text-secondary-400" />
                 Verification Statistics
              </h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="p-8 bg-indigo-500/5 dark:bg-indigo-900/10 rounded-[2.5rem] border-2 border-indigo-100/50 dark:border-indigo-900/30 transform transition-transform hover:-translate-y-2 duration-500">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">Pending Review</p>
                 <p className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{requests.length}</p>
              </div>
              <div className="p-8 bg-secondary-50/50 dark:bg-secondary-900/40 rounded-[2.5rem] border-2 border-secondary-50 dark:border-secondary-800 transform transition-transform hover:-translate-y-2 duration-500">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-2">Avg. Response Time</p>
                 <p className="text-4xl font-black text-secondary-900 dark:text-white-80 tracking-tighter">1.5h</p>
              </div>
              <div className="p-8 bg-secondary-50/50 dark:bg-secondary-900/40 rounded-[2.5rem] border-2 border-secondary-50 dark:border-secondary-800 transform transition-transform hover:-translate-y-2 duration-500">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-2">Success Rate</p>
                 <p className="text-4xl font-black text-emerald-500 tracking-tighter">98.2%</p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
