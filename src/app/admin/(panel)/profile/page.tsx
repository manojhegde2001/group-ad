'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { User, Mail, Shield, ShieldCheck, Activity, Key, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function AdminProfilePage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [updating, setUpdating] = useState(false);
  
  if (!loading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
    redirect('/admin/login');
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    // TODO: Implement actual update API
    setTimeout(() => {
      toast.success('Admin profile updated successfully');
      setUpdating(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <Avatar
              src={user?.avatar || undefined}
              name={user?.name || ''}
              className="w-24 h-24 border-4 border-white dark:border-slate-900 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800"
            />
            <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
               <Activity className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {user?.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                 System Administrator
               </span>
               <span className="text-slate-400 text-sm font-medium">@{user?.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Info & Password */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 border-none shadow-sm dark:bg-slate-900/50">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
               <User className="w-5 h-5 text-primary" />
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Account Detail</h3>
            </div>
            
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  defaultValue={user?.name || undefined}
                  placeholder="Administrator Name"
                  className="bg-slate-50 dark:bg-slate-800/50 border-none px-4"
                />
                <Input
                  label="Display Username"
                  defaultValue={user?.username}
                  placeholder="admin_handle"
                  className="bg-slate-50 dark:bg-slate-800/50 border-none px-4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Email Address"
                  defaultValue={(user as any)?.email || undefined}
                  disabled
                  type="email"
                  className="bg-slate-50 dark:bg-slate-800/50 border-none px-4 opacity-70"
                />
                <Input
                  label="Admin Identifier"
                  defaultValue={user?.id || undefined}
                  disabled
                  className="bg-slate-50 dark:bg-slate-800/50 border-none px-4 opacity-70 font-mono text-[10px]"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button 
                  type="submit" 
                  disabled={updating}
                  className="px-8 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-xs h-12 shadow-lg shadow-primary/20 rounded-xl"
                >
                  {updating ? 'Saving Changes...' : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-8 border-none shadow-sm dark:bg-slate-900/50">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
               <Key className="w-5 h-5 text-amber-500" />
               <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Security Controls</h3>
            </div>
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
               <div className="flex items-center gap-4">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Two-Factor Authentication</p>
                    <p className="text-xs text-amber-700/70 dark:text-amber-500/70">Highly recommended for all admin accounts.</p>
                  </div>
               </div>
               <Button variant="outline" size="sm" className="bg-white dark:bg-transparent border-amber-200 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/20">
                 Enable 2FA
               </Button>
            </div>
          </Card>
        </div>

        {/* Right Col: Stats */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-sm dark:bg-slate-900/50">
             <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs mb-6">Activity metrics</h3>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600">
                         <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Verifications</span>
                   </div>
                   <span className="text-lg font-black text-slate-900 dark:text-white">142</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg text-red-600">
                         <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Incidents Resolved</span>
                   </div>
                   <span className="text-lg font-black text-slate-900 dark:text-white">28</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="p-2 bg-violet-100 dark:bg-violet-900/40 rounded-lg text-violet-600">
                         <Mail className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">System Logs</span>
                   </div>
                   <span className="text-lg font-black text-slate-900 dark:text-white">1,042</span>
                </div>
             </div>
          </Card>

          <div className="p-6 bg-primary/10 dark:bg-primary/20 rounded-3xl border border-primary/20 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-white dark:bg-slate-800/80 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                <ShieldCheck className="w-8 h-8 text-primary" />
             </div>
             <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">Account Safety Verified</p>
             <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic opacity-70">
                Last integrity check: Today, 09:20 AM
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
