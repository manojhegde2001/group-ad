'use client';

import { useState } from 'react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { 
  Users, CalendarDays, FileText, 
  ArrowLeft, Download, RefreshCw, BarChart3,
  Award, Tags
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAdminAnalytics } from '@/hooks/use-api/use-admin';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState('30d');
  
  // Queries
  const { data, isLoading, error, refetch } = useAdminAnalytics(range);

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-secondary-500">
      <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
      <p className="font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Aggregating platform intelligence...</p>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-red-500">
      <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
        <p className="font-black uppercase text-xs tracking-widest mb-1">Error Loading Analytics</p>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">{(error as any)?.message || 'Something went wrong'}</p>
      </div>
      <button onClick={() => refetch()} className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-[0.2em]">
        Try Again
      </button>
    </div>
  );

  const userDistData = Object.entries(data.distribution?.users || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-secondary-50 dark:border-secondary-900/60 pb-10">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-secondary-400 hover:text-primary transition-all mb-4 uppercase tracking-[0.2em] group">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-violet-500/20 ring-4 ring-violet-500/10">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase leading-none mb-2">
                Insights <span className="text-violet-500 italic">&</span> Analytics
              </h1>
              <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em]">Real-time performance and growth metrics</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border-2 border-secondary-50 dark:border-secondary-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-secondary-600 hover:bg-secondary-50 transition-all active:scale-95 shadow-sm">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button 
            onClick={() => refetch()}
            className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-primary/20 border-b-4 border-primary-700"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Members', value: data.summary?.totalUsers || 0, icon: Users, color: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/10' },
          { label: 'Published Posts', value: data.summary?.totalPosts || 0, icon: FileText, color: 'from-emerald-500 to-emerald-600', shadow: 'shadow-emerald-500/10' },
          { label: 'Active Events', value: data.summary?.totalEvents || 0, icon: CalendarDays, color: 'from-amber-500 to-amber-600', shadow: 'shadow-amber-500/10' },
          { label: 'Total Enrollments', value: data.summary?.totalEnrollments || 0, icon: Award, color: 'from-violet-500 to-violet-600', shadow: 'shadow-violet-500/10' },
        ].map((stat) => (
          <Card key={stat.label} className={cn("p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-1 transition-all duration-500", stat.shadow)}>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white transform group-hover:rotate-12 transition-transform duration-500", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            {/* Background Decorative Element */}
            <div className={cn("absolute -bottom-6 -right-6 w-24 h-24 bg-gradient-to-br opacity-[0.03] group-hover:opacity-10 rounded-full transition-all duration-700", stat.color)} />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Growth Trend Chart */}
        <Card className="lg:col-span-2 p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Activity Trend</h3>
              <p className="text-[10px] text-secondary-400 font-black uppercase tracking-[0.3em]">Last 30 Days Platform Growth</p>
            </div>
            <div className="flex items-center gap-6 text-[9px] uppercase font-black tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500 border-2 border-white dark:border-slate-800 shadow-md" /> Users</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800 shadow-md" /> Posts</div>
            </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trends}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#94a3b8" opacity={0.1} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 900}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '1.5rem', padding: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}
                  labelStyle={{ fontSize: '11px', fontWeight: 900, marginBottom: '12px', color: '#f8fafc', textTransform: 'uppercase', letterSpacing: '0.2em' }}
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" animationDuration={2000} />
                <Area type="monotone" dataKey="posts" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorPosts)" animationDuration={2500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User Distribution */}
        <Card className="p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[3rem] overflow-hidden relative">
          <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Audience</h3>
          <p className="text-[10px] text-secondary-400 font-black uppercase tracking-[0.3em] mb-10">User Type Distribution</p>
          
          <div className="h-[320px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userDistData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                  animationBegin={200}
                  cornerRadius={12}
                >
                  {userDistData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter">{data.summary?.totalUsers || 0}</span>
              <span className="text-[8px] font-black text-secondary-400 uppercase tracking-[0.3em]">Total Members</span>
            </div>
          </div>

          <div className="mt-10 space-y-4">
            {userDistData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between p-4 bg-secondary-50/50 dark:bg-slate-800/40 rounded-2xl transition-all hover:scale-[1.02]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.1em]">{entry.name}</span>
                </div>
                <span className="text-sm font-black text-secondary-900 dark:text-white">{(entry.value as number).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Events */}
        <Card className="p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Top Events</h3>
              <p className="text-[10px] text-secondary-400 font-black uppercase tracking-[0.3em]">Highest Student Enrollment</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-6">
            {data.topContent?.events?.map((event: any, i: number) => (
              <div key={event.id} className="group relative">
                <div className="flex items-center justify-between relative z-10 py-2">
                  <div className="flex items-center gap-5">
                    <span className="text-4xl font-black text-secondary-50 dark:text-slate-800 tabular-nums">0{i+1}</span>
                    <div className="min-w-0">
                      <p className="font-black text-secondary-900 dark:text-white text-sm uppercase tracking-tight truncate max-w-[250px] leading-tight mb-1">{event.title}</p>
                      <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-widest leading-none">Global Event Tracking</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-xl border border-primary/10 transition-colors group-hover:bg-primary group-hover:text-white">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-black tabular-nums">{event._count.enrollments}</span>
                  </div>
                </div>
                {/* Visual Bar Background */}
                <div 
                  className="absolute bottom-0 left-[68px] h-1 bg-primary/20 rounded-full transition-all duration-1000 group-hover:bg-primary group-hover:h-1.5" 
                  style={{ width: `calc(${(event._count.enrollments / (data.topContent.events[0]?._count.enrollments || 1)) * 100}% - 80px)` }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Top Categories */}
        <Card className="p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[3rem]">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter leading-none mb-2">Top Categories</h3>
              <p className="text-[10px] text-secondary-400 font-black uppercase tracking-[0.3em]">Market Share & Frequency</p>
            </div>
            <div className="w-12 h-12 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500">
              <Tags className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.topContent?.categories?.map((cat: any, i: number) => (
              <div key={cat.id} className="bg-secondary-50/50 dark:bg-slate-800/40 p-6 rounded-[2rem] border-2 border-transparent hover:border-pink-500/20 transition-all flex flex-col justify-between group hover:-translate-y-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-100 dark:border-secondary-700 flex items-center justify-center font-black text-secondary-300 group-hover:text-pink-500 transition-colors shadow-sm">
                    {cat.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-secondary-900 dark:text-white leading-none mb-1">{cat._count.events}</p>
                    <p className="text-[8px] text-secondary-400 font-black uppercase tracking-[0.2em]">Active Records</p>
                  </div>
                </div>
                <div>
                  <p className="font-black text-secondary-900 dark:text-white text-xs uppercase tracking-widest mb-1">{cat.name}</p>
                  <p className="text-[9px] text-pink-500 font-black uppercase tracking-[0.1em] opacity-80">Primary Growth Core</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
}
