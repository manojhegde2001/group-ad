'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import {
  ShieldCheck, Users, CalendarDays, Building, FileText,
  TrendingUp, Clock, CheckCircle, AlertCircle, Loader2,
  ArrowUpRight, BarChart3, Eye, Tags, ShieldAlert, Plus
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
    redirect('https://www.groupad.net/');
  }

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.stats.totalUsers, icon: Users, color: 'blue', sub: `${stats.stats.businessUsers} business · ${stats.stats.individualUsers} individual` },
        { label: 'Total Posts', value: stats.stats.totalPosts, icon: FileText, color: 'green', sub: 'published posts' },
        { label: 'Events', value: stats.stats.totalEvents, icon: CalendarDays, color: 'orange', sub: `${stats.stats.publishedEvents} published` },
        { label: 'Pending Reports', value: stats.stats.pendingReports, icon: ShieldAlert, color: 'red', sub: 'requires review' },
      ]
    : [];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-900/30',
    green: 'from-green-50 to-emerald-50/50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-100 dark:border-green-900/30',
    orange: 'from-orange-50 to-amber-50/50 dark:from-orange-900/10 dark:to-amber-900/10 border-orange-100 dark:border-orange-900/30',
    red: 'from-red-50 to-rose-50/50 dark:from-red-900/10 dark:to-rose-900/10 border-red-100 dark:border-red-900/30',
  };

  const iconColorMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400',
    red: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  };

  const adminLinks = [
    { href: '/admin/analytics', label: 'Platform Analytics', icon: BarChart3, desc: 'View growth trends, engagement, and top performing content' },
    { href: '/admin/reports', label: 'Moderation Reports', icon: ShieldAlert, desc: 'Review user-submitted reports and take action' },
    { href: '/admin/users', label: 'Manage Users', icon: Users, desc: 'View all users, change roles, suspend accounts' },
    { href: '/admin/categories', label: 'Manage Categories', icon: Tags, desc: 'Add, edit, and organize interest categories' },
    { href: '/admin/events', label: 'Manage Events', icon: CalendarDays, desc: 'Create, edit, publish, cancel events' },
    { href: '/admin/businesses', label: 'Businesses', icon: Building, desc: 'Review and verify business accounts' },
    { href: '/admin/events/create', label: 'Create New Event', icon: Plus, desc: 'Instantly start the event creation wizard' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-2xl text-purple-600 dark:text-purple-400">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
            Admin Dashboard
          </h1>
          <p className="text-secondary-500 mt-0.5 text-sm">Platform overview and management</p>
        </div>
      </div>

      {/* Stats Grid */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-secondary-100 dark:bg-secondary-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className={`p-5 rounded-2xl bg-gradient-to-br border shadow-sm hover:shadow-md transition-shadow ${colorMap[color]}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl ${iconColorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-secondary-500 text-sm font-medium">{label}</p>
              </div>
              <p className="text-3xl font-black text-secondary-900 dark:text-white">{value}</p>
              <p className="text-xs text-secondary-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-secondary-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-secondary-400" /> Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminLinks.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group p-5 bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-secondary-100 dark:bg-secondary-800 rounded-xl group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                  <Icon className="w-5 h-5 text-secondary-600 dark:text-secondary-400 group-hover:text-primary-600 transition-colors" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 transition-colors" />
              </div>
              <p className="font-bold text-secondary-900 dark:text-white text-sm">{label}</p>
              <p className="text-xs text-secondary-500 mt-0.5 leading-relaxed">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary-400" /> Recent Users
            </h3>
            <Link href="/admin/users" className="text-xs text-primary-600 hover:underline font-semibold flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {statsLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded-xl animate-pulse" />)}</div>
          ) : stats?.recentUsers?.length === 0 ? (
            <p className="text-secondary-400 text-sm py-4 text-center">No users yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                  <Avatar src={u.avatar} name={u.name} size="sm" className="w-9 h-9 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-secondary-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-xs text-secondary-500">@{u.username} · {u.userType}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {u.verificationStatus === 'VERIFIED' && <CheckCircle className="w-4 h-4 text-primary-500" />}
                    <span className="text-[10px] text-secondary-400">{formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-secondary-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary-400" /> Recent Posts
            </h3>
          </div>
          {statsLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary-100 dark:bg-secondary-800 rounded-xl animate-pulse" />)}</div>
          ) : stats?.recentPosts?.length === 0 ? (
            <p className="text-secondary-400 text-sm py-4 text-center">No posts yet</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentPosts?.map((post: any) => (
                <div key={post.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors">
                  <Avatar src={post.user.avatar} name={post.user.name} size="sm" className="w-9 h-9 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-secondary-700 dark:text-secondary-300 truncate">{post.content.slice(0, 60)}{post.content.length > 60 ? '…' : ''}</p>
                    <p className="text-xs text-secondary-500">by {post.user.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-secondary-400 shrink-0">
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
          <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              {stats.stats.pendingUpgradeRequests} business upgrade request{stats.stats.pendingUpgradeRequests > 1 ? 's' : ''} waiting for review
            </p>
            <Link href="/admin/businesses" className="ml-auto text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline whitespace-nowrap">
              Review →
            </Link>
          </div>
        )}
        {!statsLoading && stats?.stats?.pendingReports > 0 && (
          <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">
              {stats.stats.pendingReports} moderation report{stats.stats.pendingReports > 1 ? 's' : ''} requiring attention
            </p>
            <Link href="/admin/reports" className="ml-auto text-xs font-bold text-red-700 dark:text-red-300 hover:underline whitespace-nowrap">
              Take Action →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
