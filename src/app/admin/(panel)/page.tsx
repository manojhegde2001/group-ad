'use client';

import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import {
  Users, CalendarDays, Building, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Loader2,
  BarChart3, ShieldAlert, Plus, Zap, ArrowRight, Tags, ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAdminStats } from '@/hooks/use-api/use-admin';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  // Queries
  const { data: stats, isLoading: statsLoading } = useAdminStats({
    enabled: isAuthenticated && (user as any)?.userType === 'ADMIN',
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (user as any)?.userType !== 'ADMIN')) {
        redirect('/admin/login');
    }
  }, [authLoading, isAuthenticated, user]);

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
          trend: stats.stats.trends?.users || '0%',
          trendDanger: stats.stats.trends?.users?.startsWith('-'),
        },
        {
          label: 'Total Posts',
          value: stats.stats.totalPosts,
          icon: FileText,
          gradient: 'from-emerald-500/10 to-emerald-600/5 dark:from-emerald-500/20 dark:to-emerald-600/5',
          border: 'border-emerald-500/10 dark:border-emerald-500/20',
          iconBg: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300',
          sub: `${stats.stats.periodStats?.postsLast30 || 0} in last 30d`,
          trend: stats.stats.trends?.posts || '0%',
          trendDanger: stats.stats.trends?.posts?.startsWith('-'),
        },
        {
          label: 'Events',
          value: stats.stats.totalEvents,
          icon: CalendarDays,
          gradient: 'from-amber-500/10 to-amber-600/5 dark:from-amber-500/20 dark:to-amber-600/5',
          border: 'border-amber-500/10 dark:border-amber-500/20',
          iconBg: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300',
          sub: `${stats.stats.publishedEvents} published`,
          trend: stats.stats.trends?.events || '0%',
          trendDanger: stats.stats.trends?.events?.startsWith('-'),
        },
        {
          label: 'Pending Reports',
          value: stats.stats.pendingReports,
          icon: ShieldAlert,
          gradient: 'from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/5',
          border: 'border-red-500/10 dark:border-red-500/20',
          iconBg: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300',
          sub: 'requires review',
          trend: (stats?.stats?.pendingReports ?? 0) > 0 ? 'Action needed' : 'All clear',
          trendDanger: (stats?.stats?.pendingReports ?? 0) > 0,
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

  if (authLoading) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Verifying access</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 via-primary/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none uppercase">
               Administrator <span className="text-primary italic">Console</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold uppercase text-[10px] tracking-widest max-w-sm">
               Your central command center for platform operations, growth monitoring, and community safety.
            </p>
          </div>
          <div className="hidden sm:block">
             <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner group transition-all hover:rotate-12 duration-500">
                <Zap className="w-8 h-8 fill-current opacity-80" />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
         <div className="flex items-center justify-between mb-5 px-1">
            <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Platform Statistics</h2>
            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 mx-4" />
         </div>
         {statsLoading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {[...Array(4)].map((_, i) => (
               <div key={i} className="h-40 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-pulse shadow-sm" />
             ))}
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {statCards.map(({ label, value, icon: Icon, gradient, border, iconBg, sub, trend, trendDanger }) => (
               <div
                 key={label}
                 className={`group relative overflow-hidden p-7 rounded-[2.5rem] bg-white dark:bg-transparent bg-gradient-to-br ${gradient} border ${border} hover:border-opacity-60 transition-all duration-500 hover:-translate-y-2 shadow-sm hover:shadow-2xl hover:shadow-primary/5`}
               >
                 <div className="flex items-center justify-between mb-6">
                   <div className={`p-3 rounded-2xl ${iconBg} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                     <Icon className="w-5 h-5" />
                   </div>
                   <span className={`text-[10px] font-black px-3 py-1 rounded-xl border-2 ${trendDanger ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-950/20 shadow-red-500/5' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 shadow-slate-500/5'} uppercase tracking-tight shadow-sm`}>
                     {trend}
                   </span>
                 </div>
                 <p className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter mb-1">{value}</p>
                 <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">{label}</p>
                 <div className="mt-6 pt-4 border-t border-slate-100/50 dark:border-slate-800/50 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider opacity-80">{sub}</p>
                 </div>
               </div>
             ))}
           </div>
         )}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-5 px-1">
          <h2 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Management Commands</h2>
          <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 mx-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {adminLinks.map(({ href, label, icon: Icon, desc, danger, accent }) => (
            <Link
              key={href}
              href={getAdminHref(href)}
              className={`group p-6 rounded-[2.25rem] border transition-all duration-500 hover:-translate-y-1 shadow-sm hover:shadow-xl flex flex-col items-center text-center gap-4 ${
                accent
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                  : danger
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900/40 shadow-red-500/5'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-4 rounded-2xl transition-all shadow-inner duration-500 ${
                accent
                  ? 'bg-primary/20 text-primary dark:text-primary group-hover:scale-110'
                  : danger
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/60'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-primary active:scale-90 group-hover:rotate-6'
              }`}>
                <Icon className="w-5 h-5 transition-transform" />
              </div>
              <div className="min-w-0">
                <p className={`text-[10px] font-black leading-tight ${accent ? 'text-primary' : 'text-slate-900 dark:text-white/80'} uppercase tracking-widest mb-1.5`}>{label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-tight opacity-70 truncate">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Feed Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="xl:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Recent Users */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-slate-800 dark:text-white/90 flex items-center gap-3 uppercase tracking-widest">
                 <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400 shadow-inner">
                    <Clock className="w-4 h-4" />
                 </div>
                 Recent Users
               </h3>
               <Link href={getAdminHref('/users')} className="text-[10px] text-primary hover:text-white hover:bg-primary font-black flex items-center gap-2 transition-all uppercase tracking-widest border border-primary/20 p-2 rounded-xl group/btn active:scale-95">
                 VIEW ALL <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
               </Link>
             </div>
             {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
                 ))}
               </div>
             ) : stats?.recentUsers?.length === 0 ? (
               <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                 <Users className="w-12 h-12 text-slate-200 mb-4" />
                 <p className="text-xs font-black uppercase tracking-widest text-slate-400">No recent users</p>
               </div>
             ) : (
               <div className="space-y-1">
                 {stats?.recentUsers?.map((u: any) => (
                   <div key={u.id} className="flex items-center gap-4 p-3 rounded-[1.75rem] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group active:scale-[0.98]">
                     <Avatar src={u.avatar} name={u.name} className="w-11 h-11 shrink-0 rounded-2xl shadow-sm border-2 border-transparent group-hover:border-primary/20 transition-all duration-500" />
                     <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight">{u.name}</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-black uppercase tracking-widest">@{u.username} · {u.userType}</p>
                     </div>
                     <div className="flex items-center gap-3 shrink-0">
                       {u.verificationStatus === 'VERIFIED' && (
                         <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shadow-emerald-500/20" />
                         </div>
                       )}
                       <span className="text-[9px] text-slate-400 font-black bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded-lg uppercase tracking-tight">
                         {formatDistanceToNow(new Date(u.createdAt), { addSuffix: false })}
                       </span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* Recent Content */}
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
               <h3 className="text-xs font-black text-slate-800 dark:text-white/90 flex items-center gap-3 uppercase tracking-widest">
                 <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-inner">
                    <TrendingUp className="w-4 h-4" />
                 </div>
                 Live Feed
               </h3>
             </div>
             {statsLoading ? (
               <div className="space-y-4">
                 {[...Array(5)].map((_, i) => (
                   <div key={i} className="h-14 bg-slate-50 dark:bg-slate-800/40 rounded-2xl animate-pulse" />
                 ))}
               </div>
             ) : stats?.recentPosts?.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
                    <Zap className="w-12 h-12 text-slate-200 mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">No recent activity</p>
                </div>
             ) : (
               <div className="space-y-1">
                 {stats?.recentPosts?.map((post: any) => (
                   <div key={post.id} className="flex items-center gap-4 p-3 rounded-[1.75rem] hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group active:scale-[0.98]">
                     <Avatar src={post.user.avatar} name={post.user.name} className="w-11 h-11 shrink-0 rounded-2xl shadow-sm border-2 border-transparent group-hover:border-primary/20 transition-all duration-500" />
                     <div className="flex-1 min-w-0">
                       <p className="text-sm text-slate-700 dark:text-slate-300 font-bold truncate leading-tight italic tracking-tight mb-1 opacity-90 transition-opacity group-hover:opacity-100">" {post.content} "</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">Post by <span className="text-slate-600 dark:text-slate-400 underline decoration-primary/30">{post.user.name}</span></p>
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2 py-1 rounded-xl shrink-0 group-hover:text-primary transition-colors">
                       <ArrowUpRight className="w-3.5 h-3.5" /> {post._count.postLikes}
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>
        </div>

        {/* Priority Alerts */}
        <div className="space-y-6">
           <div className="px-2 flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Critical Alerts</h3>
           </div>
           {!statsLoading && (stats?.stats?.pendingUpgradeRequests ?? 0) > 0 && (
             <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-amber-50 to-white dark:from-amber-900/10 dark:to-slate-900 border-2 border-amber-100 dark:border-amber-500/20 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
               <div className="p-4 bg-amber-100 dark:bg-amber-500/20 rounded-[1.5rem] text-amber-600 dark:text-amber-400 shadow-inner animate-pulse">
                  <AlertCircle className="w-7 h-7" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-base font-black text-amber-900 dark:text-amber-200 uppercase tracking-tighter leading-tight">
                   {(stats?.stats?.pendingUpgradeRequests ?? 0)} Businesses
                 </p>
                 <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black uppercase tracking-widest mt-1 opacity-70">Awaiting Verification</p>
               </div>
               <Link href={getAdminHref('/businesses')} className="h-12 w-12 flex items-center justify-center bg-amber-600 dark:bg-amber-500 text-white rounded-[1.25rem] hover:bg-amber-700 transition-all shadow-lg shadow-amber-600/20 active:scale-90">
                 <ArrowRight className="w-6 h-6" />
               </Link>
             </div>
           )}
           
           {!statsLoading && (stats?.stats?.pendingReports ?? 0) > 0 && (
             <div className="flex items-center gap-5 p-6 bg-gradient-to-r from-red-50 to-white dark:from-red-900/10 dark:to-slate-900 border-2 border-red-100 dark:border-red-500/20 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
               <div className="p-4 bg-red-100 dark:bg-red-500/20 rounded-[1.5rem] text-red-600 dark:text-red-400 shadow-inner">
                  <ShieldAlert className="w-7 h-7" />
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-base font-black text-red-900 dark:text-red-200 uppercase tracking-tighter leading-tight">
                   {(stats?.stats?.pendingReports ?? 0)} Active Reports
                 </p>
                 <p className="text-[10px] text-red-600 dark:text-red-400 font-black uppercase tracking-widest mt-1 opacity-70">Moderation Required</p>
               </div>
               <Link href={getAdminHref('/reports')} className="h-12 w-12 flex items-center justify-center bg-red-600 dark:bg-red-500 text-white rounded-[1.25rem] hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-90">
                 <ArrowRight className="w-6 h-6" />
               </Link>
             </div>
           )}
 
           {statsLoading ? (
             <div className="h-40 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 animate-pulse" />
           ) : (stats?.stats?.pendingReports ?? 0) === 0 && (stats?.stats?.pendingUpgradeRequests ?? 0) === 0 && (
             <div className="py-16 px-8 border-2 border-dashed border-slate-100/60 dark:border-slate-800/60 rounded-[3rem] flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] flex items-center justify-center text-emerald-500 mb-6 border border-emerald-100 dark:border-emerald-900/30 shadow-inner">
                   <CheckCircle className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 mb-2">Queue All Clear</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed">No high-priority tasks requiring<br/>immediate attention at this time</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
