'use client';

import { useState, useEffect } from 'react';
import { moderationService } from '@/services/api/moderation';
import { 
  ShieldAlert, Clock, CheckCircle, XCircle, AlertCircle, 
  MoreHorizontal, User, FileText, CalendarDays, MessageSquare,
  Search, Filter, ChevronDown, ExternalLink, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge, Button, Dropdown, Input, Select } from 'rizzui';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/avatar';
import Link from 'next/link';

const statusColors: Record<string, any> = {
  PENDING: { color: 'warning', icon: Clock, label: 'Pending' },
  REVIEWED: { color: 'primary', icon: Eye, label: 'Reviewed' },
  RESOLVED: { color: 'success', icon: CheckCircle, label: 'Resolved' },
  DISMISSED: { color: 'danger', icon: XCircle, label: 'Dismissed' },
};

const typeIcons: Record<string, any> = {
  USER: User,
  POST: FileText,
  EVENT: CalendarDays,
  MESSAGE: MessageSquare,
};

// Dummy Eye icon since it was missing in statusColors but used in thought
import { Eye } from 'lucide-react';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data: any = await moderationService.getAdminReports();
      setReports(data.reports);
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
    const adminNote = window.prompt('Add an optional admin note:');
    try {
      await moderationService.updateReportStatus({ reportId, status, adminNote: adminNote || undefined });
      toast.success(`Report ${status.toLowerCase()} successfully`);
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update report');
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesFilter = filter === 'ALL' || r.status === filter;
    const matchesSearch = r.reason.toLowerCase().includes(search.toLowerCase()) || 
                          r.reporter.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-secondary-200 dark:border-secondary-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl text-red-600 dark:text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-secondary-900 dark:text-white">
              Moderation Reports
            </h1>
            <p className="text-secondary-500 mt-0.5 text-sm">Review and act on user flags</p>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white dark:bg-secondary-900 p-4 rounded-2xl border border-secondary-100 dark:border-secondary-800">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
          <Input
            placeholder="Search reports or reporters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
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
            className="w-full md:w-44"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-secondary-900 rounded-2xl border border-secondary-100 dark:border-secondary-800 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-secondary-50 dark:bg-secondary-800/50 rounded-full">
              <CheckCircle className="w-12 h-12 text-secondary-300" />
            </div>
            <p className="text-secondary-500 font-medium">No reports found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-secondary-100 dark:border-secondary-800 bg-secondary-50/50 dark:bg-secondary-800/20">
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-secondary-500">Target</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-secondary-500">Reason</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-secondary-500">Reporter</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-secondary-500">Date</th>
                  <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-secondary-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-wider text-secondary-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
                {filteredReports.map((report) => {
                  const TypeIcon = typeIcons[report.targetType] || FileText;
                  const status = statusColors[report.status];
                  const StatusIcon = status.icon;

                  return (
                    <tr key={report.id} className="hover:bg-secondary-50/50 dark:hover:bg-secondary-800/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary-100 dark:bg-secondary-800 rounded-lg text-secondary-600 dark:text-secondary-400">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-secondary-900 dark:text-white uppercase tracking-tighter text-[11px]">{report.targetType}</p>
                            <p className="text-xs text-secondary-500 font-mono">ID: {report.targetId.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-semibold text-secondary-900 dark:text-white">{report.reason}</p>
                          {report.description && (
                            <p className="text-xs text-secondary-500 mt-0.5 line-clamp-1">{report.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar src={report.reporter.avatar} name={report.reporter.name} size="sm" className="w-6 h-6" />
                          <span className="text-sm font-medium text-secondary-700 dark:text-secondary-300 truncate max-w-[120px]">
                            {report.reporter.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-secondary-500">
                          {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant="flat"
                          color={status.color}
                          className="flex items-center gap-1.5 w-fit"
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <Dropdown placement="bottom-end">
                          <Dropdown.Trigger>
                            <button className="p-2 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-lg transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </Dropdown.Trigger>
                          <Dropdown.Menu className="w-48 p-1">
                            {report.status !== 'RESOLVED' && (
                              <Dropdown.Item 
                                onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                                className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-green-50 text-green-600 cursor-pointer"
                              >
                                <CheckCircle className="w-4 h-4" /> Resolve
                              </Dropdown.Item>
                            )}
                            {report.status !== 'DISMISSED' && (
                              <Dropdown.Item 
                                onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                                className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4" /> Dismiss
                              </Dropdown.Item>
                            )}
                            {report.status === 'PENDING' && (
                              <Dropdown.Item 
                                onClick={() => handleUpdateStatus(report.id, 'REVIEWED')}
                                className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary-100 text-secondary-900 dark:text-white cursor-pointer"
                              >
                                <Eye className="w-4 h-4" /> Mark Reviewed
                              </Dropdown.Item>
                            )}
                            <Dropdown.Item 
                              className="flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg hover:bg-secondary-100 text-secondary-900 dark:text-white cursor-pointer"
                              onClick={() => {
                                // Logic to view target
                                if (report.targetType === 'POST') window.open(`/post/${report.targetId}`, '_blank');
                                if (report.targetType === 'USER') window.open(`/profile/${report.reporter.username}`, '_blank'); // Needs real target username
                              }}
                            >
                              <ExternalLink className="w-4 h-4" /> View Content
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      {!loading && (
        <div className="flex items-center gap-6 p-4 bg-secondary-50 dark:bg-secondary-800/30 rounded-2xl border border-secondary-100 dark:border-secondary-800 text-xs font-bold text-secondary-500 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-warning" />
            <span>{reports.filter(r => r.status === 'PENDING').length} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>{reports.filter(r => r.status === 'RESOLVED').length} Resolved</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-danger" />
            <span>{reports.filter(r => r.status === 'DISMISSED').length} Dismissed</span>
          </div>
        </div>
      )}
    </div>
  );
}
