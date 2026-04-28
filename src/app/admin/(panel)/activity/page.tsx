'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import {
  Clock, TrendingUp, ArrowLeft,
  ChevronLeft, ChevronRight, MessageSquare, Heart,
  ArrowUpRight, Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdminActivity } from '@/hooks/use-api/use-admin';
import Link from 'next/link';

export default function AdminActivityPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Queries
  const { data, isLoading } = useAdminActivity({
    page,
    limit,
  });

  const posts = data?.posts || [];

  if (authLoading) return null;
  if (!isAuthenticated || (user as any)?.userType !== 'ADMIN') return null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-secondary-50 dark:border-secondary-900/60 pb-10">
        <div>
          <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black text-secondary-400 hover:text-primary transition-all mb-4 uppercase tracking-[0.2em] group">
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-500/10">
              <Zap className="w-8 h-8 fill-current opacity-80" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase leading-none mb-2">
                Live <span className="text-emerald-500 italic">Feed</span>
              </h1>
              <p className="text-secondary-400 text-[10px] font-black uppercase tracking-[0.3em]">Comprehensive platform activity monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-900/40 rounded-[3rem] shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50/50 dark:bg-secondary-800/20 border-b border-secondary-100 dark:border-secondary-800">
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Creator</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Content Snippet</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400 text-center">Engagement</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Timestamp</th>
                <th className="px-8 py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">Fetching Live Data</p>
                    </div>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <Clock className="w-16 h-16 text-secondary-200" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">No activity recorded yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post: any) => (
                  <tr key={post.id} className="group hover:bg-secondary-50/30 dark:hover:bg-secondary-800/20 transition-all duration-300">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <Avatar src={post.user.avatar} name={post.user.name} className="w-11 h-11 shrink-0 rounded-2xl shadow-sm border-2 border-transparent group-hover:border-primary/20 transition-all duration-500" />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-900 dark:text-white truncate tracking-tight uppercase leading-tight">{post.user.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-black uppercase tracking-widest leading-none mt-1">@{post.user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium line-clamp-1 italic max-w-xs transition-opacity group-hover:opacity-100 opacity-80">
                        " {post.content} "
                      </p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center justify-center gap-6">
                          <div className="flex items-center gap-2">
                             <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/10" />
                             <span className="text-xs font-black tabular-nums text-slate-700 dark:text-slate-300">{post._count.postLikes}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <MessageSquare className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" />
                             <span className="text-xs font-black tabular-nums text-slate-700 dark:text-slate-300">{post._count.postComments}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] text-slate-400 font-black bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-lg uppercase tracking-tight">
                         {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <Link 
                         href={`/posts/${post.id}`}
                         target="_blank"
                         className="inline-flex items-center gap-2 text-[10px] font-black text-primary hover:text-white hover:bg-primary transition-all uppercase tracking-widest border border-primary/20 px-3 py-1.5 rounded-xl group/btn active:scale-95"
                       >
                         OPEN <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="px-8 py-6 bg-secondary-50/30 dark:bg-secondary-800/10 border-t border-secondary-100 dark:border-secondary-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">
              Showing <span className="text-secondary-900 dark:text-white">{(page - 1) * limit + 1}</span> to <span className="text-secondary-900 dark:text-white">{Math.min(page * limit, data.total)}</span> of <span className="text-secondary-900 dark:text-white">{data.total}</span> records
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-secondary-700 text-secondary-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1.5 px-3">
                {[...Array(data.pages)].map((_, i) => {
                  const p = i + 1;
                  if (p === 1 || p === data.pages || Math.abs(p - page) <= 1) {
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={cn(
                          "w-9 h-9 rounded-xl text-[10px] font-black transition-all active:scale-90",
                          page === p 
                            ? "bg-primary text-white shadow-lg shadow-primary/20" 
                            : "bg-white dark:bg-slate-800 text-secondary-400 hover:text-secondary-900 dark:hover:text-white border border-secondary-100 dark:border-secondary-700 shadow-sm"
                        )}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === 2 || p === data.pages - 1) {
                    return <span key={p} className="text-secondary-300">...</span>;
                  }
                  return null;
                }).filter(Boolean).reduce((acc: any[], curr, i, arr) => {
                  if (curr?.type === 'span' && arr[i-1]?.type === 'span') return acc;
                  return [...acc, curr];
                }, [])}
              </div>

              <button
                onClick={() => setPage(p => Math.min(data.pages, p + 1))}
                disabled={page === data.pages}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-secondary-100 dark:border-secondary-700 text-secondary-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all shadow-sm active:scale-90"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
