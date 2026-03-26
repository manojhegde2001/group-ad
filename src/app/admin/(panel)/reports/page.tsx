'use client';

import { useState, useEffect } from 'react';
import { moderationService } from '@/services/api/moderation';
import {
  ShieldAlert, Clock, CheckCircle, XCircle, AlertCircle,
  MoreHorizontal, User, FileText, CalendarDays, MessageSquare,
  Search, Filter, ChevronDown, ExternalLink, Loader2, Eye,
  ShieldQuestion, UserX, Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusColors: Record<string, { color: string; icon: any; label: string }> = {
  PENDING: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Pending' },
  REVIEWED: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Eye, label: 'Reviewed' },
  RESOLVED: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Resolved' },
  DISMISSED: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Dismissed' },
};

const typeIcons: Record<string, any> = {
  USER: User,
  POST: FileText,
  EVENT: CalendarDays,
  MESSAGE: MessageSquare,
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data: any = await moderationService.getAdminReports();
      setReports(data.reports || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, status: string) => {
    setProcessingId(reportId);
    const adminNote = window.prompt('Add an optional admin note:');
    try {
      await moderationService.updateReportStatus({ reportId, status, adminNote: adminNote || undefined });
      toast.success(`Report ${status.toLowerCase()} successfully`);
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update report');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch = r.reason.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tight uppercase">
            Moderation Reports
          </h1>
          <p className="text-secondary-500 font-medium mt-1 uppercase text-xs tracking-widest">
            Review and resolve user-flagged content to maintain community standards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-red-100 dark:border-red-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            {reports.filter(r => r.status === 'PENDING').length} Urgent Flags
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-secondary-900 p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm">
        <div className="md:col-span-2">
          <Input
            prefix={<Search />}
            clearable
            onClear={() => setSearch('')}
            placeholder="Search reports or reporters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="">
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
      <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-800 rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">Target Type</th>
                <th className="px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500">Reason & Detail</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-secondary-500">Reporter</th>
                <th className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-secondary-500">Status</th>
                <th className="px-6 py-4 text-right font-black text-[10px] uppercase tracking-widest text-secondary-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                      <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">Fetching Flags...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <ShieldQuestion className="w-12 h-12 text-secondary-200" />
                      <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">Clear Skies! No reports</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => {
                  const TypeIcon = typeIcons[report.targetType] || FileText;
                  const statusInfo = statusColors[report.status] || statusColors.PENDING;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={report.id} className="group hover:bg-secondary-50/50 dark:hover:bg-secondary-900/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 rounded-xl flex items-center justify-center text-secondary-600 dark:text-secondary-400 ring-2 ring-secondary-50 dark:ring-secondary-800/50 shadow-sm">
                            <TypeIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400">{report.targetType}</p>
                            <p className="text-xs font-mono font-bold text-secondary-600 dark:text-secondary-400 mt-0.5">#{report.targetId.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="max-w-md">
                          <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight">{report.reason}</p>
                          {report.description && (
                            <p className="text-xs text-secondary-500 mt-1 line-clamp-2 bg-secondary-50/50 dark:bg-secondary-800/30 p-2 rounded-lg border border-secondary-100 dark:border-secondary-800/50 italic">
                              "{report.description}"
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={report.reporter.avatar} name={report.reporter.name} className="w-8 h-8 rounded-xl shadow-sm" />
                          <div>
                            <p className="text-xs font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate max-w-[120px]">{report.reporter.name}</p>
                            <p className="text-[10px] font-bold text-secondary-400 truncate max-w-[120px]">@{report.reporter.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                          statusInfo.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                        <p className="text-[9px] font-bold text-secondary-400 mt-1 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {report.targetType === 'POST' && (
                            <Link
                              href={`/post/${report.targetId}`}
                              target="_blank"
                              className="p-2.5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400 rounded-xl hover:bg-primary-500 hover:text-white transition-all active:scale-95 shadow-sm"
                              title="View Content"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}
                          {report.status !== 'RESOLVED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                              className="p-2.5 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500 hover:text-white transition-all active:scale-95 shadow-sm"
                              title="Resolve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {report.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                              className="p-2.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-sm"
                              title="Mark Reviewed"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {report.status !== 'DISMISSED' && (
                            <button
                              onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                              className="p-2.5 bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-sm"
                              title="Dismiss"
                            >
                              <XCircle className="w-4 h-4" />
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

      {/* Footer Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: reports.filter(r => r.status === 'PENDING').length, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
            { label: 'Reviewed', count: reports.filter(r => r.status === 'REVIEWED').length, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
            { label: 'Resolved', count: reports.filter(r => r.status === 'RESOLVED').length, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { label: 'Dismissed', count: reports.filter(r => r.status === 'DISMISSED').length, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/10' },
          ].map(stat => (
            <div key={stat.label} className={cn("p-6 rounded-[2rem] border border-secondary-100 dark:border-secondary-800 shadow-sm", stat.bg)}>
              <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 mb-1">{stat.label}</p>
              <p className={cn("text-2xl font-black", stat.color)}>{stat.count}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
