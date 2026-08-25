'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert, Clock, CheckCircle, XCircle,
  User, FileText, CalendarDays, MessageSquare,
  Search, Eye,
  ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { DataGrid, DataGridPagination, DataGridToolbar, DataGridColumn, DataGridAction } from '@/components/ui/data-grid';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useReports, useUpdateReport } from '@/hooks/use-api/use-admin';

interface AdminReport {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reporter: { name: string; username: string; avatar: string };
}

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

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Queries
  const { data, isLoading } = useReports({
    page,
    limit,
    search: search || undefined,
    status: filter !== 'ALL' ? filter : undefined
  });
  const reports = data?.reports || [];

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  // Mutations
  const updateReportMutation = useUpdateReport();

  const handleUpdateStatus = (reportId: string, status: string) => {
    const adminNote = window.prompt('Add an optional admin note:');
    updateReportMutation.mutate({ reportId, status, adminNote: adminNote || undefined });
  };

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;

  const columns: DataGridColumn<AdminReport>[] = [
    {
      key: 'targetType',
      header: 'Target Type',
      sortable: true,
      render: (report) => {
        const TypeIcon = typeIcons[report.targetType] || FileText;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800/50 rounded-lg flex items-center justify-center text-secondary-600 dark:text-secondary-400 shrink-0">
              <TypeIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-secondary-400">{report.targetType}</p>
              <p className="text-[10px] font-mono font-semibold text-secondary-300 dark:text-secondary-600">#{report.targetId.slice(-6)}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Reason & Detail',
      sortable: true,
      render: (report) => (
        <div className="max-w-md min-w-[180px]">
          <p className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-tight leading-none mb-1">{report.reason}</p>
          {report.description && (
            <p className="text-[11px] text-secondary-500 font-medium italic border-l-2 border-primary/20 pl-2 line-clamp-1">
              "{report.description}"
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'reporter',
      header: 'Reporter',
      sortable: true,
      accessor: (report) => report.reporter.name,
      render: (report) => (
        <div className="flex items-center gap-2.5">
          <Avatar src={report.reporter.avatar} name={report.reporter.name} className="w-8 h-8 rounded-lg shadow-sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-secondary-900 dark:text-white uppercase tracking-tight truncate max-w-[120px] leading-none mb-0.5">{report.reporter.name}</p>
            <p className="text-[10px] font-semibold text-secondary-400 uppercase tracking-wide leading-none">@{report.reporter.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (report) => {
        const statusInfo = statusColors[report.status] || statusColors.PENDING;
        const StatusIcon = statusInfo.icon;
        return (
          <>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border",
              statusInfo.color
            )}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
            </div>
            <p className="text-[10px] font-semibold text-secondary-300 mt-1 uppercase tracking-tight opacity-80">
              {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
            </p>
          </>
        );
      },
    },
  ];

  const actions: DataGridAction<AdminReport>[] = [
    {
      key: 'view',
      icon: ArrowRight,
      variant: 'default',
      title: 'View Content',
      show: (report) => report.targetType === 'POST',
      href: (report) => `/post/${report.targetId}`,
      newTab: true,
    },
    {
      key: 'resolve',
      icon: CheckCircle,
      variant: 'success',
      title: 'Resolve',
      show: (report) => report.status !== 'RESOLVED',
      disabled: () => updateReportMutation.isPending,
      onClick: (report) => handleUpdateStatus(report.id, 'RESOLVED'),
    },
    {
      key: 'review',
      icon: Eye,
      variant: 'primary',
      title: 'Mark Reviewed',
      show: (report) => report.status === 'PENDING',
      disabled: () => updateReportMutation.isPending,
      onClick: (report) => handleUpdateStatus(report.id, 'REVIEWED'),
    },
    {
      key: 'dismiss',
      icon: XCircle,
      variant: 'danger',
      title: 'Dismiss',
      show: (report) => report.status !== 'DISMISSED',
      disabled: () => updateReportMutation.isPending,
      onClick: (report) => handleUpdateStatus(report.id, 'DISMISSED'),
    },
  ];

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
      <DataGridToolbar
        search={
          <Input
            prefix={<Search className="w-4 h-4 text-slate-400" />}
            clearable
            onClear={() => setSearch('')}
            placeholder="Search reports or reporters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border-none bg-slate-100 dark:bg-slate-800"
          />
        }
        filters={
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
        }
      />

      {/* Reports Grid */}
      <DataGrid
        columns={columns}
        data={reports}
        loading={isLoading}
        emptyMessage="All Clear! No reports"
        getRowId={(report) => report.id}
        actions={actions}
        expandedRowId={expandedReportId}
        onToggleExpand={(id) => setExpandedReportId((prev) => (prev === id ? null : (id as string)))}
        expandable={{
          render: (report) => (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 mb-2">Full Report</p>
                <p className="text-sm font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">{report.reason}</p>
                {report.description && (
                  <p className="text-[13px] text-secondary-500 dark:text-secondary-400 font-medium italic border-l-2 border-primary/20 pl-3 py-1">
                    "{report.description}"
                  </p>
                )}
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-secondary-400 space-y-2">
                <p>Target ID: <span className="text-secondary-700 dark:text-secondary-200 font-mono normal-case">{report.targetId}</span></p>
                <p>Reported: <span className="text-secondary-700 dark:text-secondary-200">{new Date(report.createdAt).toLocaleString()}</span></p>
                <p>Reporter: <span className="text-secondary-700 dark:text-secondary-200">{report.reporter.name} (@{report.reporter.username})</span></p>
              </div>
            </div>
          ),
        }}
        footer={
          data && (
            <DataGridPagination
              page={page}
              totalPages={data.pages}
              total={data.total}
              pageSize={limit}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
              itemLabel="records"
            />
          )
        }
      />

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
