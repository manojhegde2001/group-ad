'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Check, X, Loader2, Building2, User, Calendar, Globe, MapPin, ShieldCheck, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface VerificationRequest {
  id: string;
  userId: string;
  companyName: string;
  categoryId: string;
  industry: string;
  gstNumber: string;
  turnover: string;
  companySize: string;
  establishedYear: string;
  companyWebsite: string;
  reason: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
}

export default function AdminBusinessesPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verification-requests');
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch {
      toast.error('An error occurred while fetching requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/verification-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setRequests(prev => prev.filter(r => r.id !== id));
      } else {
        toast.error(data.error || `Failed to ${action.toLowerCase()} request`);
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated || (currentUser as any)?.userType !== 'ADMIN') {
    redirect('/');
    return null;
  }

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase">
          Business Verification
        </h1>
        <p className="text-secondary-500 font-medium mt-1 uppercase text-xs tracking-widest">
          Review and manage professional account requests
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-8 border-2 border-secondary-100 dark:border-secondary-800 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-8 border-b border-secondary-50 dark:border-secondary-800 pb-6">
            <h3 className="font-black text-lg text-indigo-600 dark:text-indigo-400 uppercase tracking-tight flex items-center gap-2">
               <ShieldCheck className="w-6 h-6" />
               Pending Approvals ({requests.length})
            </h3>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
               <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
               <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">Fetching Requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-20 bg-secondary-50/50 dark:bg-secondary-900/50 rounded-3xl border border-dashed border-secondary-200 dark:border-secondary-800">
               <Building2 className="w-12 h-12 text-secondary-300 mx-auto mb-4" />
               <p className="text-secondary-500 font-bold uppercase text-xs tracking-widest">
                 No pending businesses waiting for approval.
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="group relative flex flex-col lg:flex-row lg:items-center justify-between p-6 bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 rounded-3xl hover:border-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/5 duration-300"
                >
                  <div className="flex items-start gap-5 flex-1 min-w-0">
                    <Avatar 
                      src={req.user.avatar} 
                      name={req.user.name} 
                      className="w-16 h-16 rounded-2xl ring-4 ring-secondary-50 dark:ring-secondary-800 shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-lg text-secondary-900 dark:text-white truncate">
                            {req.companyName}
                          </h4>
                          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                            {req.industry || 'Business'}
                          </span>
                       </div>
                       
                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-500">
                             <User className="w-3.5 h-3.5" />
                             {req.user.name} <span className="text-secondary-300">({req.user.email})</span>
                          </div>
                          {req.gstNumber && (
                             <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500">
                               <ShieldCheck className="w-3.5 h-3.5" />
                               GST: {req.gstNumber}
                             </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-400">
                             <Calendar className="w-3.5 h-3.5" />
                             Requested: {new Date(req.createdAt).toLocaleDateString()}
                          </div>
                       </div>

                       {req.reason && (
                         <p className="mt-3 text-sm text-secondary-500 line-clamp-2 italic bg-secondary-50 dark:bg-secondary-800/40 p-3 rounded-xl border border-secondary-100 dark:border-secondary-800">
                           "{req.reason}"
                         </p>
                       )}
                       
                       <div className="flex flex-wrap items-center gap-4 mt-4">
                          {req.companyWebsite && (
                             <a href={req.companyWebsite} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline">
                               <Globe className="w-3 h-3" /> Website
                             </a>
                          )}
                          {req.companySize && (
                             <span className="flex items-center gap-1.5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">
                               <MapPin className="w-3 h-3" /> Size: {req.companySize}
                             </span>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-6 lg:mt-0 lg:pl-10 shrink-0">
                    <button 
                      onClick={() => handleAction(req.id, 'APPROVED')}
                      disabled={!!processingId}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'REJECTED')}
                      disabled={!!processingId}
                      className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-secondary-800 text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/10 font-black text-xs uppercase tracking-widest rounded-2xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        <Card className="p-8 border-2 border-secondary-100 dark:border-secondary-800 rounded-[2rem] shadow-sm">
           <div className="flex items-center justify-between mb-8 border-b border-secondary-50 dark:border-secondary-800 pb-6">
              <h3 className="font-black text-lg text-secondary-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                 <ShieldAlert className="w-6 h-6 text-secondary-400" />
                 Verification Statistics
              </h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Waiting Review</p>
                 <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{requests.length}</p>
              </div>
              <div className="p-6 bg-secondary-50 dark:bg-secondary-900/50 rounded-3xl border border-secondary-100 dark:border-secondary-800">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Verified Today</p>
                 <p className="text-3xl font-black text-secondary-900 dark:text-white">0</p>
              </div>
              <div className="p-6 bg-secondary-50 dark:bg-secondary-900/50 rounded-3xl border border-secondary-100 dark:border-secondary-800">
                 <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mb-1">Success Rate</p>
                 <p className="text-3xl font-black text-secondary-900 dark:text-white">100%</p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
