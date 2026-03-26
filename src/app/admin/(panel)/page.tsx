'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import {
  Users, CalendarDays, Building, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Loader2,
  ArrowUpRight, BarChart3, Eye, Tags, ShieldAlert, Plus,
  Zap, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  if (!loading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
    redirect('/admin/login');
  }

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.stats.totalUsers,
          icon: Users,
          gradient: 'from-violet-500/10 to-violet-600/5 dark:from-violet-500/20 dark:to-violet-600/5',
          border: 'border-violet-500/10 dark:border-violet-500/20',
          iconBg: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300',
          sub: `${stats.stats.businessUsers} business · ${stats.stats.individualUsers} individual`,
          trend: '+12%',
        },
        {
          label: 'Total Posts',
          value: stats.stats.totalPosts,
          icon: FileText,
          gradient: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/5',
          border: 'border-emerald-500/10 dark:border-emerald-500/20',
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
          sub: 'published posts',
          trend: '+8%',
        },
        {
          label: 'Events',
          value: stats.stats.totalEvents,
          icon: CalendarDays,
          gradient: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/5',
          border: 'border-amber-500/10 dark:border-amber-500/20',
          iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
          sub: `${stats.stats.publishedEvents} published`,
          trend: '+5%',
        },
        {
          label: 'Pending Reports',
          value: stats.stats.pendingReports,
          icon: ShieldAlert,
          gradient: 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/5',
          border: 'border-red-500/10 dark:border-red-500/20',
          iconBg: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300',
          sub: 'requires review',
          trend: stats.stats.pendingReports > 0 ? 'Action needed' : 'All clear',
          trendDanger: stats.stats.pendingReports > 0,
        },
      ]
    : [];

  const getAdminHref = (path: string) => {
    if (typeof window === 'undefined') return `/admin${path}`;
    const isSubdomain = window.location.hostname.startsWith('admin.');
    if (isSubdomain) return path;
    return `/admin${path}`;
  };

  const adminLinks = [
    { href: '/analytics', label: 'Platform Analytics', icon: BarChart3, desc: 'Growth trends & engagement' },
    { href: '/reports', label: 'Moderation', icon: ShieldAlert, desc: 'Review reports & actions', danger: true },
    { href: '/users', label: 'Manage Users', icon: Users, desc: 'Roles, accounts, status' },
    { href: '/categories', label: 'Categories', icon: Tags, desc: 'Organize interest tags' },
    { href: '/events', label: 'Events', icon: CalendarDays, desc: 'Create & publish events' },
    { href: '/businesses', label: 'Businesses', icon: Building, desc: 'Verify business accounts' },
    { href: '/events/create', label: 'New Event', icon: Plus, desc: 'Quick create wizard', accent: true },
  ];

  return (
    <div className="px-6 py-8 md:px-8 space-y-8 max-w-[1600px] mx-auto transition-colors duration-300">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
               Administrator <span className="text-primary italic">Console</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium max-w-md">
               Welcome to your command center. Monitor platform growth, manage users, and keep the community safe.
            </p>
          </div>
          <div className="hidden sm:block">
             <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                <Zap className="w-8 h-8 fill-current opacity-80" />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
         <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Platform Pulse</h2>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 mx-4" />
         </div>
         {statsLoading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="h-32 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
             ))}
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {statCards.map(({ label, value, icon: Icon, gradient, border, iconBg, sub, trend, trendDanger }) => (
               <div
                 key={label}
                 className={`group relative overflow-hidden p-6 rounded-3xl bg-white dark:bg-transparent bg-gradient-to-br ${gradient} border ${border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-xl`}
               >
                 <div className="flex items-center justify-between mb-4">
                   <div className={`p-2.5 rounded-2xl ${iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                     <Icon className="w-5 h-5" />
                   </div>
                   <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${trendDanger ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'} uppercase tracking-tight`}>
                     {trend}
                   </span>
                 </div>
                 <p className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">{value}</p>
                 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-wider">{label}</p>
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium italic opacity-70 border-t border-slate-100 dark:border-slate-800 pt-2">{sub}</p>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Management Tools</h2>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 mx-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {adminLinks.map(({ href, label, icon: Icon, desc, danger, accent }) => (
            <Link
              key={href}
              href={getAdminHref(href)}
              className={`group p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-lg flex flex-col items-center text-center gap-4 ${
                accent
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                  : danger
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/40'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-3 rounded-2xl transition-all shadow-inner ${
                accent
                  ? 'bg-primary/20 text-primary dark:text-primary'
                  : danger
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-primary active:scale-95'
              }`}>
                <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <p className={`text-xs font-black leading-tight ${accent ? 'text-primary' : 'text-slate-900 dark:text-white/80'} uppercase tracking-tighter mb-1`}>{label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-tight opacity-80">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Feed Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Recent Users */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black text-slate-800 dark:text-white/90 flex items-center gap-2.5">
                 <div className="p-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 dark:text-violet-400">
                    <Clock className="w-4 h-4" />
                 </div>
                 Recent Users
               </h3>
               <Link href={getAdminHref('/users')} className="text-[10px] text-primary hover:text-primary/80 font-black flex items-center gap-1 transition-colors uppercase tracking-widest border border-primary/20 px-2 py-1 rounded-lg">
                 All <ArrowRight className="w-3 h-3" />
               </Link>
             </div>
             {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
                 ))}
               </div>
             ) : stats?.recentUsers?.length === 0 ? (
               <p className="text-slate-400 text-sm py-12 text-center italic font-medium">No users yet</p>
             ) : (
               <div className="space-y-2">
                 {stats?.recentUsers?.map((u: any) => (
                   <div key={u.id} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 shadow-none hover:shadow-sm">
                     <Avatar src={u.avatar} name={u.name} className="w-10 h-10 shrink-0 rounded-xl" />
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5">{u.name}</p>
                       <p className="text-[11px] text-slate-500 dark:text-slate-500 truncate font-medium">@{u.username} · {u.userType}</p>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                       {u.verificationStatus === 'VERIFIED' && (
                         <CheckCircle className="w-4 h-4 text-emerald-500" />
                       )}
                       <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                         {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Recent Content */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-sm font-black text-slate-800 dark:text-white/90 flex items-center gap-2.5">
                 <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                 </div>
                 Platform Activity
               </h3>
             </div>
             {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
                 ))}
               </div>
             ) : stats?.recentPosts?.length === 0 ? (
               <p className="text-slate-400 text-sm py-12 text-center italic font-medium">No activity yet</p>
             ) : (
               <div className="space-y-2">
                 {stats?.recentPosts?.map((post: any) => (
                   <div key={post.id} className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group border border-transparent hover:border-slate-100 dark:hover:border-slate-800 shadow-none hover:shadow-sm">
                     <Avatar src={post.user.avatar} name={post.user.name} className="w-10 h-10 shrink-0 rounded-xl" />
                     <div className="flex-1 min-w-0">
                       <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold truncate leading-tight mb-0.5 italic">" {post.content.slice(0, 50)}{post.content.length > 50 ? '…' : ''} "</p>
                       <p className="text-[11px] text-slate-500 font-medium truncate">Posted by <span className="font-bold">{post.user.name}</span></p>
                     </div>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg shrink-0">
                       <Eye className="w-3.5 h-3.5" /> {post._count.postLikes}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-6">
           <div className="px-1 flex items-center justify-between mb-1">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Priority Alerts</h3>
           </div>
           {!statsLoading && stats?.stats?.pendingUpgradeRequests > 0 && (
             <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
               <div className="p-3 bg-amber-100 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 shadow-inner">
                  <AlertCircle className="w-6 h-6" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tighter">
                   {stats.stats.pendingUpgradeRequests} Business Upgrades
                 </p>
                 <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold opacity-80 mt-0.5">Verification requests pending</p>
               </div>
               <Link href={getAdminHref('/businesses')} className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-700 dark:hover:bg-amber-600 transition-all shadow-md active:scale-95">
                 Verify
               </Link>
             </div>
           )}
           
           {!statsLoading && stats?.stats?.pendingReports > 0 && (
             <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-red-50 to-white dark:from-red-900/20 dark:to-slate-900 border border-red-200 dark:border-red-500/20 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
               <div className="p-3 bg-red-100 dark:bg-red-500/20 rounded-2xl text-red-600 dark:text-red-400 shadow-inner">
                  <ShieldAlert className="w-6 h-6" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-black text-red-900 dark:text-red-200 uppercase tracking-tighter">
                   {stats.stats.pendingReports} Platform Reports
                 </p>
                 <p className="text-[10px] text-red-700 dark:text-red-400 font-bold opacity-80 mt-0.5">Critical moderation required</p>
               </div>
               <Link href={getAdminHref('/reports')} className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 dark:hover:bg-red-600 transition-all shadow-md active:scale-95">
                 Act
               </Link>
             </div>
           )}

           {!statsLoading && stats?.stats?.pendingReports === 0 && stats?.stats?.pendingUpgradeRequests === 0 && (
             <div className="p-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center opacity-60">
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 dark:border-emerald-900/30">
                   <CheckCircle className="w-6 h-6" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Queue Clear</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium">All priority tasks are completed</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
