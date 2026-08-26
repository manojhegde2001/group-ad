'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Eye, TrendingUp, Users, FileText,
  ArrowUpRight, Award, Zap, ArrowUp, ArrowDown,
  Loader2, Target, BarChart3, X, Image as ImageIcon, Video, File as FileIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { useProfileAnalytics, usePostsAnalytics, useBusinessAnalytics } from '@/hooks/use-api/use-analytics';
import { AppImage } from '@/components/ui/app-image';

export default function AnalyticsDashboard({ userType = 'INDIVIDUAL' }: { userType?: string }) {
  const [activeView, setActiveView] = useState<'profile' | 'posts' | 'business'>('profile');

  // Queries - Only fetch what is needed for the active view to avoid unnecessary errors/403s
  const profileQuery = useProfileAnalytics({ enabled: activeView === 'profile' });
  const postsQuery = usePostsAnalytics({ enabled: activeView === 'posts' });
  const businessQuery = useBusinessAnalytics({ 
    enabled: activeView === 'business' && (userType === 'BUSINESS' || userType === 'ADMIN') 
  });

  const currentQuery = activeView === 'profile' ? profileQuery 
                    : activeView === 'posts' ? postsQuery 
                    : businessQuery;

  const data = currentQuery.data as any;
  const loading = currentQuery.isLoading;
  const isError = currentQuery.isError;
  const error = currentQuery.error;

  // Trend delta (second half vs first half of the 30-day window) — only computed
  // for stats that are actually backed by daily series data, so we never fabricate precision.
  const trendDelta = (key: string) => {
    const trends = data?.trends as any[] | undefined;
    if (!trends || trends.length < 4) return null;
    const mid = Math.floor(trends.length / 2);
    const firstHalf = trends.slice(0, mid).reduce((sum, t) => sum + (t[key] || 0), 0);
    const secondHalf = trends.slice(mid).reduce((sum, t) => sum + (t[key] || 0), 0);
    if (firstHalf === 0) return secondHalf > 0 ? { pct: null, direction: 'up' as const } : null;
    const pct = ((secondHalf - firstHalf) / firstHalf) * 100;
    if (Math.abs(pct) < 1) return { pct: 0, direction: 'flat' as const };
    return { pct: Math.round(pct), direction: pct > 0 ? ('up' as const) : ('down' as const) };
  };

  if (loading) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-secondary-500">
      <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      <p className="font-bold border-b border-primary-500 pb-1">Analyzing...</p>
    </div>
  );

  if (isError) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-red-500 bg-white dark:bg-secondary-900 rounded-[2rem] border border-red-100 dark:border-red-900/30">
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl">
        <X className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center">
        <p className="font-black uppercase tracking-tight">Analysis Interrupted</p>
        <p className="text-[10px] font-bold text-secondary-400 mt-1 uppercase">{(error as any)?.message || 'Failed to fetch data'}</p>
      </div>
      <button 
        onClick={() => currentQuery.refetch()}
        className="mt-2 px-6 py-2 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 rounded-xl text-[10px] font-black uppercase tracking-widest"
      >
        Retry
      </button>
    </div>
  );

  if (!data) return (
    <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-secondary-500 bg-white dark:bg-secondary-900 rounded-[2rem] border border-secondary-100 dark:border-secondary-800">
      <BarChart3 className="w-12 h-12 text-secondary-200" />
      <p className="font-bold text-sm uppercase tracking-tight">No analytics data available yet</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Sub-Tabs */}
      <div className="flex gap-2 p-1 bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 shadow-sm w-fit">
        <button 
          onClick={() => setActiveView('profile')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeView === 'profile' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
          )}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveView('posts')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeView === 'posts' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
          )}
        >
          Posts
        </button>
        {userType === 'BUSINESS' && (
          <button 
            onClick={() => setActiveView('business')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeView === 'business' ? "bg-primary-500 text-white shadow-lg shadow-primary-500/20" : "text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200"
            )}
          >
            Intelligence
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeView === 'profile' && (
          <>
            <StatCard label="Total Views" value={data.summary.totalViews} icon={Eye} color="text-blue-500" bg="bg-blue-50" trend={trendDelta('views')} />
            <StatCard label="Unique Viewers" value={data.summary.uniqueViewers} icon={Users} color="text-violet-500" bg="bg-violet-50" />
            <StatCard label="Engagement" value={`${data.summary.engagement || 0}%`} icon={Zap} color="text-amber-500" bg="bg-amber-50" />
          </>
        )}
        {activeView === 'posts' && (
          <>
            <StatCard label="Total Reach" value={data.summary.totalReach} icon={TrendingUp} color="text-emerald-500" bg="bg-emerald-50" trend={trendDelta('views')} />
            <StatCard label="Posts" value={data.summary.totalPosts} icon={FileText} color="text-pink-500" bg="bg-pink-50" />
            <StatCard label="Avg. Likes" value={data.summary.avgLikes || 0} icon={Award} color="text-orange-500" bg="bg-orange-50" />
          </>
        )}
        {activeView === 'business' && (
          <>
            <StatCard label="Brand Reach" value={data.summary.totalReach} icon={Target} color="text-indigo-500" bg="bg-indigo-50" trend={trendDelta('companyReach')} />
            <StatCard label="Market Share" value={data.summary.industryRank} icon={TrendingUp} color="text-sky-500" bg="bg-sky-50" />
            <StatCard label="Competitors" value={data.categoryInfo.totalCompetitors} icon={Users} color="text-rose-500" bg="bg-rose-50" />
          </>
        )}
      </div>

      {/* Main Chart */}
      <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50 rounded-[2rem] overflow-hidden">
        <div className="mb-8">
            <h3 className="text-lg font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                {activeView === 'profile' ? 'Profile Visibility' : activeView === 'posts' ? 'Reach Trend' : 'Brand vs Market Growth'}
            </h3>
            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest mt-1">Last 30 Days Activity</p>
        </div>
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                    <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorComments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 800}} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', padding: '12px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#fff' }}
                    />
                    {(activeView === 'posts' || activeView === 'business') && (
                        <Legend
                            verticalAlign="top"
                            align="right"
                            height={32}
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        />
                    )}
                    {activeView === 'profile' && (
                        <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                    )}
                    {activeView === 'posts' && (
                        <>
                            <Area type="monotone" dataKey="views" name="Views" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" dataKey="likes" name="Likes" stroke="#d97706" strokeWidth={2} fillOpacity={1} fill="url(#colorLikes)" />
                            <Area type="monotone" dataKey="comments" name="Comments" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorComments)" />
                        </>
                    )}
                    {activeView === 'business' && (
                        <>
                            <Area type="monotone" dataKey="companyReach" name="Your Reach" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
                            <Area type="monotone" dataKey="categoryGrowth" name="Category Growth" stroke="#059669" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />
                        </>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Recent Viewers or Top Posts */}
        {activeView === 'profile' && (
          <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50 rounded-[2rem]">
            <h4 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest mb-6">Recent Viewers</h4>
            <div className="flex gap-4 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {data.recentViewers?.map((viewer: any, index: number) => (
                <div key={viewer.id || `viewer-${index}`} className="flex flex-col items-center gap-2 shrink-0 w-16 snap-start group">
                   <div className="w-12 h-12 rounded-xl bg-secondary-100 dark:bg-secondary-800 overflow-hidden relative transition-transform group-hover:scale-105">
                       {viewer.avatar ? <AppImage src={viewer.avatar} alt="" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-secondary-400 capitalize">{viewer.name?.[0] || '?'}</div>}
                   </div>
                  <div className="text-center min-w-0 w-full">
                      <p className="text-[10px] font-black text-secondary-900 dark:text-white uppercase truncate">{viewer.name}</p>
                      <p className="text-[8px] text-secondary-400 font-bold truncate">@{viewer.username}</p>
                  </div>
                </div>
              ))}
              {(!data.recentViewers || data.recentViewers.length === 0) && (
                  <p className="text-xs text-secondary-400 italic text-center py-4 w-full">No recent identifiable viewers</p>
              )}
            </div>
          </Card>
        )}

        {activeView === 'posts' && (
          <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50 rounded-[2rem]">
            <h4 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest mb-6">Top Performing Posts</h4>
            <div className="space-y-4">
              {data.topPosts?.map((post: any, index: number) => {
                const thumb = post.images?.[0];
                const TypeIcon = post.type === 'IMAGE' ? ImageIcon : post.type === 'VIDEO' ? Video : post.type === 'DOCUMENT' ? FileIcon : FileText;
                return (
                  <div key={post.id || `post-${index}`} className="flex items-center gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0 relative overflow-hidden">
                        {thumb ? <AppImage src={thumb} alt="" fill className="object-cover" /> : <TypeIcon className="w-5 h-5 text-primary-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-secondary-900 dark:text-white truncate">{post.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-[9px] font-black text-secondary-400 uppercase flex items-center gap-1"><Eye className="w-2.5 h-2.5" /> {post.views}</span>
                            <span className="text-[9px] font-black text-secondary-400 uppercase flex items-center gap-1"><Award className="w-2.5 h-2.5" /> {post.likesCount}</span>
                            <span className="text-[9px] font-black text-secondary-300 uppercase">{post.type}</span>
                        </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-secondary-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {activeView === 'business' && (
            <Card className="p-6 border-none shadow-sm dark:bg-secondary-900/50 rounded-[2rem]">
                <h4 className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-widest mb-6">Industry Neighbors</h4>
                <div className="space-y-4">
                    {data.competitors?.map((comp: any, index: number) => (
                        <div key={comp.name || `comp-${index}`} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-white border border-secondary-100 dark:border-secondary-800 p-1 relative overflow-hidden">
                                     {comp.logo ? <AppImage src={comp.logo} alt="" fill className="object-contain" /> : <div className="w-full h-full bg-secondary-50 flex items-center justify-center text-[10px] font-black text-secondary-300 uppercase">{comp.name?.[0] || '?'}</div>}
                                 </div>
                                <p className="text-xs font-black text-secondary-900 dark:text-white uppercase">{comp.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-secondary-900 dark:text-white">{comp.activity}</p>
                                <p className="text-[9px] text-secondary-400 font-bold uppercase">Actions</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        )}
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, trend }: any) {
    return (
        <Card className="p-5 border-none shadow-sm dark:bg-secondary-900/50 hover:shadow-md transition-all group overflow-hidden relative rounded-[2rem]">
            <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10 group-hover:scale-110 transition-transform", bg.replace('50', '500'))} />
            <div className="flex items-center gap-4 relative z-10">
                <div className={cn("p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110", bg, color)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">{label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xl font-black text-secondary-900 dark:text-white tracking-tight">{value}</p>
                        {trend && trend.direction !== 'flat' && (
                            <span className={cn(
                                "flex items-center gap-0.5 text-[10px] font-black",
                                trend.direction === 'up' ? 'text-emerald-500' : 'text-red-500'
                            )}>
                                {trend.direction === 'up' ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                                {trend.pct === null ? 'New' : `${Math.abs(trend.pct)}%`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
