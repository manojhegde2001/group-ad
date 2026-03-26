'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import {
  ShieldCheck, Users, CalendarDays, Building, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Loader2,
  ArrowUpRight, BarChart3, Eye, Tags, ShieldAlert, Plus,
  Zap, Activity, ArrowRight
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
          gradient: 'from-violet-500/20 to-violet-600/5',
          border: 'border-violet-500/20',
          iconBg: 'bg-violet-500/20 text-violet-300',
          sub: `${stats.stats.businessUsers} business · ${stats.stats.individualUsers} individual`,
          trend: '+12%',
        },
        {
          label: 'Total Posts',
          value: stats.stats.totalPosts,
          icon: FileText,
          gradient: 'from-emerald-500/20 to-emerald-600/5',
          border: 'border-emerald-500/20',
          iconBg: 'bg-emerald-500/20 text-emerald-300',
          sub: 'published posts',
          trend: '+8%',
        },
        {
          label: 'Events',
          value: stats.stats.totalEvents,
          icon: CalendarDays,
          gradient: 'from-amber-500/20 to-amber-600/5',
          border: 'border-amber-500/20',
          iconBg: 'bg-amber-500/20 text-amber-300',
          sub: `${stats.stats.publishedEvents} published`,
          trend: '+5%',
        },
        {
          label: 'Pending Reports',
          value: stats.stats.pendingReports,
          icon: ShieldAlert,
          gradient: 'from-red-500/20 to-red-600/5',
          border: 'border-red-500/20',
          iconBg: 'bg-red-500/20 text-red-300',
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
    <div className="p-5 md:p-8 space-y-7 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600/20 via-indigo-600/15 to-purple-600/10 border border-violet-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-violet-500/5 to-transparent" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">Admin Dashboard</h1>
            <p className="text-white/40 text-sm mt-0.5">Platform overview — Group Ad</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white/70">v2.0</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/[0.04] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, gradient, border, iconBg, sub, trend, trendDanger }) => (
            <div
              key={label}
              className={`group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br ${gradient} border ${border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trendDanger ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/40'}`}>
                  {trend}
                </span>
              </div>
              <p className="text-3xl font-black text-white tabular-nums">{value}</p>
              <p className="text-xs text-white/30 mt-1 font-medium">{label}</p>
              <p className="text-[11px] text-white/20 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {adminLinks.map(({ href, label, icon: Icon, desc, danger, accent }) => (
            <Link
              key={href}
              href={href}
              className={`group p-4 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 flex flex-col gap-3 ${
                accent
                  ? 'bg-violet-500/20 border-violet-500/30 hover:bg-violet-500/25 hover:border-violet-500/50'
                  : danger
                    ? 'bg-white/[0.03] border-white/[0.06] hover:bg-red-500/10 hover:border-red-500/20'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl transition-colors ${
                  accent
                    ? 'bg-violet-500/30 text-violet-200'
                    : danger
                      ? 'bg-red-500/15 text-red-300 group-hover:bg-red-500/25'
                      : 'bg-white/[0.06] text-white/40 group-hover:text-white/70 group-hover:bg-white/[0.1]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ArrowUpRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all ${accent ? 'text-violet-300' : 'text-white/40'}`} />
              </div>
              <div>
                <p className={`text-sm font-bold ${accent ? 'text-violet-200' : 'text-white/70'}`}>{label}</p>
                <p className="text-xs text-white/30 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Users */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/25" /> Recent Users
            </h3>
            <Link href="/admin/users" className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-0.5 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentUsers?.length === 0 ? (
            <p className="text-white/25 text-sm py-6 text-center">No users yet</p>
          ) : (
            <div className="space-y-1">
              {stats?.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <Avatar src={u.avatar} name={u.name} size="sm" className="w-8 h-8 shrink-0 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/80 truncate">{u.name}</p>
                    <p className="text-xs text-white/30">@{u.username} · {u.userType}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {u.verificationStatus === 'VERIFIED' && (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-[10px] text-white/25">
                      {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white/70 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-white/25" /> Recent Posts
            </h3>
          </div>
          {statsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-white/[0.04] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recentPosts?.length === 0 ? (
            <p className="text-white/25 text-sm py-6 text-center">No posts yet</p>
          ) : (
            <div className="space-y-1">
              {stats?.recentPosts?.map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <Avatar src={post.user.avatar} name={post.user.name} size="sm" className="w-8 h-8 shrink-0 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/60 truncate">{post.content.slice(0, 60)}{post.content.length > 60 ? '…' : ''}</p>
                    <p className="text-xs text-white/30">by {post.user.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/25 shrink-0">
                    <Eye className="w-3 h-3" />{post._count.postLikes}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Alerts */}
      <div className="space-y-3">
        {!statsLoading && stats?.stats?.pendingUpgradeRequests > 0 && (
          <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-sm font-semibold text-amber-300 flex-1">
              {stats.stats.pendingUpgradeRequests} business upgrade request{stats.stats.pendingUpgradeRequests > 1 ? 's' : ''} waiting for review
            </p>
            <Link href="/admin/businesses" className="text-xs font-bold text-amber-400 hover:text-amber-300 whitespace-nowrap flex items-center gap-1 transition-colors">
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
        {!statsLoading && stats?.stats?.pendingReports > 0 && (
          <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-300 flex-1">
              {stats.stats.pendingReports} moderation report{stats.stats.pendingReports > 1 ? 's' : ''} requiring attention
            </p>
            <Link href="/admin/reports" className="text-xs font-bold text-red-400 hover:text-red-300 whitespace-nowrap flex items-center gap-1 transition-colors">
              Take Action <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
