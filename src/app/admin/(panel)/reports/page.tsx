'use client';

import { useState } from 'react';
import {
  ShieldAlert, Clock, CheckCircle, XCircle,
  User, FileText, CalendarDays, MessageSquare,
  Search, Loader2, Eye,
  ShieldQuestion, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useReports, useUpdateReport } from '@/hooks/use-api/use-admin';

const statusColors: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'bg-amber-100/50 text-amber-700 border-amber-200/50', icon: Clock, label: 'Pending' },
  REVIEWED: { color: 'bg-indigo-100/50 text-indigo-700 border-indigo-200/50', icon: Eye, label: 'Reviewed' },
  RESOLVED: { color: 'bg-emerald-100/50 text-emerald-700 border-emerald-200/50', icon: CheckCircle, label: 'Resolved' },
  DISMISSED: { color: 'bg-red-100/50 text-red-700 border-red-200/50', icon: XCircle, label: 'Dismissed' },
};

const typeIcons: Record<string, any> = {
  USER: User,
  POST: FileText,
  EVENT: CalendarDays,
  MESSAGE: MessageSquare,
};

export default function AdminReportsPage() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Queries
  const { data, isLoading } = useReports();
  const reports = data?.reports || [];

  // Mutations
  const updateReportMutation = useUpdateReport();

  const handleUpdateStatus = (reportId: string, status: string) => {
    const adminNote = window.prompt('Add an optional admin note:');
    updateReportMutation.mutate({ reportId, status, adminNote: adminNote || undefined });
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch = r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-2">
            Moderation <span className="text-primary italic">Reports</span>
          </h1>
          <p className="text-secondary-400 font-bold uppercase text-[10px] tracking-widest leading-none">
            Review and resolve user-flagged content to maintain community standards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn(
              "px-5 py-2.5 rounded-2xl border-2 font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-xl transition-all",
              pendingCount > 0 ? "bg-red-500 text-white border-red-400 shadow-red-500/20" : "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
          )}>
            <ShieldAlert className="w-4 h-4 animate-pulse" />
            {pendingCount} Urgent Flags
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-secondary-100 dark:border-secondary-800 shadow-sm backdrop-blur-xl">
        <div className="md:col-span-2">
          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            clearable
            onClear={() => setSearch('')}
            placeholder="Search reports or reporters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-2xl border-none bg-slate-100 dark:bg-slate-800"
          />
        </div>
        <div>
          <Select
            value={filter}
            onChange={(val: any) => setFilter(val)}
            options={[
              { label: 'All Reports', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Reviewed', value: 'REVIEWED' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Dismissed', value: 'DISMISSED' },
            ]}
          />
        </div>
      </div>

      {/* Reports Table */}
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-900/40 rounded-[3rem] shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50/50 dark:bg-secondary-800/20 border-b border-secondary-50 dark:border-secondary-800">
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Target Type</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Reason & Detail</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Reporter</th>
                <th className="px-8 py-6 font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Status</th>
                <th className="px-8 py-6 text-right font-black text-[10px] uppercase tracking-[0.2em] text-secondary-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">Querying Records</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-6 opacity-40">
                      <ShieldQuestion className="w-16 h-16 text-secondary-200" />
                      <p className="font-black text-secondary-400 uppercase text-[10px] tracking-[0.4em]">All Clear! No reports</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const TypeIcon = typeIcons[report.targetType] || FileText;
                  const statusInfo = statusColors[report.status] || statusColors.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={report.id} className="group hover:bg-secondary-50/30 dark:hover:bg-secondary-800/20 transition-all duration-300">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-800/50 rounded-2xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 ring-4 ring-secondary-50 dark:ring-secondary-800/20 shadow-sm transition-transform group-hover:scale-110">
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400">{report.targetType}</p>
                            <p className="text-[10px] font-mono font-bold text-secondary-300 dark:text-secondary-600 mt-1">#{report.targetId.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="max-w-md min-w-[200px]">
                          <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight leading-none mb-2">{report.reason}</p>
                          {report.description && (
                            <p className="text-[11px] text-secondary-500 font-medium italic border-l-2 border-primary/20 pl-3 py-1">
                              "{report.description}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <Avatar src={report.reporter.avatar} name={report.reporter.name} className="w-10 h-10 rounded-[1.25rem] shadow-sm transform transition-transform group-hover:scale-110" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] leading-none mb-1">{report.reporter.name}</p>
                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest leading-none">@{report.reporter.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm",
                          statusInfo.color
                        )}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusInfo.label}
                        </div>
                        <p className="text-[10px] font-black text-secondary-300 mt-2 uppercase tracking-tighter opacity-80">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                          {report.targetType === 'POST' && (
                            <Link
                              href={`/post/${report.targetId}`}
                              target="_blank"
                              className="p-3 bg-secondary-50 dark:bg-secondary-800/40 text-secondary-500 dark:text-secondary-400 rounded-2xl hover:bg-primary hover:text-white transition-all active:scale-90 shadow-sm border border-secondary-100 dark:border-secondary-800/50"
                              title="View Content"
                            >
                              <ArrowRight className="w-5 h-5" />
                            </Link>
                          )}
                          {report.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                              disabled={updateReportMutation.isPending}
                              className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all active:scale-90 shadow-sm border border-emerald-100 dark:border-emerald-800/50"
                              title="Resolve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {report.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                              disabled={updateReportMutation.isPending}
                              className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all active:scale-90 shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                              title="Mark Reviewed"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          )}
                          {report.status !== 'DISMISSED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                              disabled={updateReportMutation.isPending}
                              className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm border border-red-100 dark:border-red-800/50"
                              title="Dismiss"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Section */}
      {!isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Pending', count: reports.filter(r => r.status === 'PENDING').length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
            { label: 'Reviewed', count: reports.filter(r => r.status === 'REVIEWED').length, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
            { label: 'Resolved', count: reports.filter(r => r.status === 'RESOLVED').length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { label: 'Dismissed', count: reports.filter(r => r.status === 'DISMISSED').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
          ].map(stat => (
            <div key={stat.label} className={cn("p-8 rounded-[3rem] border-2 border-secondary-50 dark:border-secondary-900/40 shadow-sm transition-transform hover:-translate-y-2 duration-500", stat.bg)}>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-2">{stat.label}</p>
              <p className={cn("text-4xl font-black tracking-tighter", stat.color)}>{stat.count}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
