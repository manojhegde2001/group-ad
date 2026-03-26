'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, CalendarDays, FileText, 
  ArrowLeft, Download, Filter, RefreshCw, BarChart3,
  Award, MapPin, MousePointer2, Tags
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-500">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      <p className="font-medium animate-pulse">Aggregating platform intelligence...</p>
    </div>
  );

  if (error) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-red-500">
      <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <p className="font-bold">Error Loading Analytics</p>
        <p className="text-sm opacity-80">{error}</p>
      </div>
      <button onClick={fetchAnalytics} className="text-sm font-bold text-primary-600 hover:underline">
        Try Again
      </button>
    </div>
  );

  const userDistData = Object.entries(data.distribution.users).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-secondary-200 dark:border-secondary-800 pb-8">
        <div>
          <Link href="/admin" className="flex items-center gap-1.5 text-xs font-bold text-secondary-500 hover:text-primary-600 mb-3 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-2xl text-violet-600 dark:text-violet-400">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600 tracking-tight">
                Insights & Analytics
              </h1>
              <p className="text-secondary-500 mt-1 text-sm font-medium">Real-time performance and growth metrics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-secondary-900 border border-secondary-200 dark:border-secondary-800 rounded-xl text-xs font-black uppercase tracking-widest text-secondary-600 hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-all active:scale-95 shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button 
            onClick={fetchAnalytics}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-600/20"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Members', value: data.summary.totalUsers, icon: Users, accent: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Published Posts', value: data.summary.totalPosts, icon: FileText, accent: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Active Events', value: data.summary.totalEvents, icon: CalendarDays, accent: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Total Enrollments', value: data.summary.totalEnrollments, icon: Award, accent: 'text-violet-500 bg-violet-50 dark:bg-violet-900/20' },
        ].map((stat) => (
          <Card key={stat.label} className="p-6 border-none shadow-sm dark:bg-secondary-900/50 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.accent.split(' ').slice(1).join(' '))}>
                <stat.icon className={cn("w-6 h-6", stat.accent.split(' ')[0])} />
              </div>
              <div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-secondary-900 dark:text-white mt-0.5 tracking-tight">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Growth Trend Chart */}
        <Card className="lg:col-span-2 p-6 border-none shadow-sm dark:bg-secondary-900/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Activity Trend</h3>
              <p className="text-xs text-secondary-400 font-bold uppercase tracking-widest mt-0.5">Last 30 Days Growth</p>
            </div>
            <div className="flex items-center gap-4 text-[10px] uppercase font-bold tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Users</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Posts</div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', padding: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 900, marginBottom: '8px', color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPosts)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Distribution */}
        <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50">
          <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-1">Audience</h3>
          <p className="text-xs text-secondary-400 font-bold uppercase tracking-widest mb-8">User Type Distribution</p>
          
          <div className="h-[280px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={200}
                  cornerRadius={8}
                >
                  {userDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-secondary-900 dark:text-white">{data.summary.totalUsers}</span>
              <span className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Total Users</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {userDistData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-secondary-600 dark:text-secondary-400 uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-secondary-900 dark:text-white">{(entry.value as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Events */}
        <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Top Events</h3>
              <p className="text-xs text-secondary-400 font-bold uppercase tracking-widest mt-0.5">By Enrollment Count</p>
            </div>
            <Award className="w-6 h-6 text-primary-500" />
          </div>

          <div className="space-y-4">
            {data.topContent.events.map((event: any, i: number) => (
              <div key={event.id} className="group relative">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-black text-secondary-100 dark:text-secondary-800">0{i+1}</span>
                    <p className="font-bold text-secondary-900 dark:text-white truncate max-w-[200px]">{event.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-secondary-400" />
                    <span className="text-sm font-black text-primary-600">{event._count.enrollments}</span>
                  </div>
                </div>
                {/* Visual Bar Background */}
                <div 
                  className="absolute inset-y-0 left-0 bg-primary-50 dark:bg-primary-900/10 rounded-xl transition-all duration-1000" 
                  style={{ width: `${(event._count.enrollments / data.topContent.events[0]._count.enrollments) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Top Categories */}
        <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">Top Categories</h3>
              <p className="text-xs text-secondary-400 font-bold uppercase tracking-widest mt-0.5">By Event Frequency</p>
            </div>
            <Tags className="w-6 h-6 text-pink-500" />
          </div>

          <div className="space-y-4">
            {data.topContent.categories.map((cat: any, i: number) => (
              <div key={cat.id} className="bg-secondary-50 dark:bg-secondary-800/50 p-4 rounded-2xl border border-transparent hover:border-primary-100 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-secondary-900 border border-secondary-100 dark:border-secondary-800 flex items-center justify-center font-black text-secondary-400 group-hover:text-primary-500 transition-colors">
                    {cat.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-secondary-900 dark:text-white text-sm">{cat.name}</p>
                    <p className="text-[10px] text-secondary-500 font-bold uppercase tracking-widest">Growth Driver</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-secondary-900 dark:text-white">{cat._count.events}</p>
                  <p className="text-[9px] text-secondary-400 font-black uppercase tracking-widest">EventsHosted</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
}
