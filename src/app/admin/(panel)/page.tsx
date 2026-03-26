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

  const adminLinks = [
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3, desc: 'Growth trends & engagement' },
    { href: '/admin/reports', label: 'Moderation', icon: ShieldAlert, desc: 'Review reports & actions', danger: true },
    { href: '/admin/users', label: 'Manage Users', icon: Users, desc: 'Roles, accounts, status' },
    { href: '/admin/categories', label: 'Categories', icon: Tags, desc: 'Organize interest tags' },
    { href: '/admin/events', label: 'Events', icon: CalendarDays, desc: 'Create & publish events' },
    { href: '/admin/businesses', label: 'Businesses', icon: Building, desc: 'Verify business accounts' },
    { href: '/admin/events/create', label: 'New Event', icon: Plus, desc: 'Quick create wizard', accent: true },
  ];

  return (
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto transition-colors duration-300">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 dark:from-primary/20 dark:via-primary/10 dark:to-transparent dark:border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-white/40 text-sm mt-0.5 font-medium">Platform overview — Group Ad</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, gradient, border, iconBg, sub, trend, trendDanger }) => (
            <div
              key={label}
              className={`group relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-transparent bg-gradient-to-br ${gradient} border ${border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendDanger ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/40'}`}>
                  {trend}
                </span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">{value}</p>
              <p className="text-xs text-slate-500 dark:text-white/30 mt-1 font-semibold uppercase tracking-wider">{label}</p>
              <p className="text-[11px] text-slate-400 dark:text-white/20 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-400 dark:text-white/60 uppercase tracking-[0.15em]">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adminLinks.map(({ href, label, icon: Icon, desc, danger, accent }) => (
            <Link
              key={href}
              href={href}
              className={`group p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md flex flex-col gap-3 ${
                accent
                  ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 dark:border-primary/30 hover:bg-primary/10 hover:border-primary/40'
                  : danger
                    ? 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20'
                    : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl transition-colors ${
                  accent
                    ? 'bg-primary/20 text-primary dark:text-primary'
                    : danger
                      ? 'bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-300 group-hover:bg-red-200 dark:group-hover:bg-red-500/25'
                      : 'bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all ${accent ? 'text-primary' : 'text-slate-400 dark:text-white/40'}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${accent ? 'text-primary' : 'text-slate-900 dark:text-white/80'}`}>{label}</p>
                <p className="text-xs text-slate-500 dark:text-white/30 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white/70 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400 dark:text-white/25" /> Recent Users
            </h3>
            <Link href="/admin/users" className="text-[11px] text-primary hover:text-primary/80 font-bold flex items-center gap-0.5 transition-colors uppercase tracking-wider">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentUsers?.length === 0 ? (
            <p className="text-slate-400 dark:text-white/25 text-sm py-8 text-center font-medium">No users yet</p>
          ) : (
            <div className="space-y-1">
              {stats?.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                  <Avatar src={u.avatar} name={u.name} size="sm" className="w-8 h-8 shrink-0 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-white/80 truncate">{u.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/30 truncate">@{u.username} · {u.userType}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {u.verificationStatus === 'VERIFIED' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-white/25 font-medium">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-white/70 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400 dark:text-white/25" /> Recent Posts
            </h3>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentPosts?.length === 0 ? (
            <p className="text-slate-400 dark:text-white/25 text-sm py-8 text-center font-medium">No posts yet</p>
          ) : (
            <div className="space-y-1">
              {stats?.recentPosts?.map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                  <Avatar src={post.user.avatar} name={post.user.name} size="sm" className="w-8 h-8 shrink-0 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-white/70 font-semibold truncate">{post.content.slice(0, 60)}{post.content.length > 60 ? '…' : ''}</p>
                    <p className="text-[11px] text-slate-500 dark:text-white/30 truncate">by {post.user.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-white/25 shrink-0">
                    <Eye className="w-3 h-3" />{post._count.postLikes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!statsLoading && stats?.stats?.pendingUpgradeRequests > 0 && (
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-900 dark:text-amber-300">
                {stats.stats.pendingUpgradeRequests} Pending Upgrades
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Business upgrade requests waiting for review</p>
            </div>
            <Link href="/admin/businesses" className="px-3 py-1 bg-amber-600 dark:bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors whitespace-nowrap">
              Review
            </Link>
          </div>
        )}
        {!statsLoading && stats?.stats?.pendingReports > 0 && (
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl shadow-sm">
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900 dark:text-red-300">
                {stats.stats.pendingReports} Platform Reports
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-400 font-medium">Moderation reports requiring immediate attention</p>
            </div>
            <Link href="/admin/reports" className="px-3 py-1 bg-red-600 dark:bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-700 dark:hover:bg-red-600 transition-colors whitespace-nowrap">
              Take Action
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
