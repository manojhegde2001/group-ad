'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface BulkEventActionsProps {
  eventId: string;
  onSuccess: () => void;
  isEventEnded: boolean;
}

export function BulkEventActions({ eventId, onSuccess, isEventEnded }: BulkEventActionsProps) {
  const [loadingType, setLoadingType] = useState<'register' | 'attendance' | null>(null);
  
  const regFileInputRef = useRef<HTMLInputElement>(null);
  const attFileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { email: 'user@example.com', username: 'johndoe' },
      { email: 'jane@example.com', username: 'janedoe' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'group_ad_bulk_template.xlsx');
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'register' | 'attendance') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingType(type);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const json = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (json.length === 0) {
        throw new Error('The spreadsheet is empty');
      }

      const payload = json.map(row => ({
        email: row.email || row.Email || '',
        username: row.username || row.Username || ''
      })).filter(r => r.email || r.username);

      if (payload.length === 0) {
        throw new Error('Could not find email or username columns');
      }

      const endpoint = type === 'register' 
        ? `/api/events/${eventId}/bulk-register` 
        : `/api/events/${eventId}/bulk-attendance`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          type === 'register' ? { participants: payload } : { attendees: payload }
        )
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to process bulk action');
      }

      toast.success(result.message, { duration: 5000 });
      onSuccess();

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoadingType(null);
      if (type === 'register' && regFileInputRef.current) regFileInputRef.current.value = '';
      if (type === 'attendance' && attFileInputRef.current) attFileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white dark:bg-secondary-900 border border-primary-200 dark:border-primary-900/50 rounded-2xl p-6 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-secondary-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary-500" /> Bulk Excel Actions
          </h3>
          <p className="text-secondary-500 text-sm mt-1">Upload a spreadsheet for rapid processing.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="text-secondary-600">
            <Download className="w-4 h-4 mr-2" /> Template
          </Button>

          <Button 
            variant="solid" 
            color="primary" 
            size="sm" 
            onClick={() => regFileInputRef.current?.click()}
            disabled={loadingType !== null}
          >
            {loadingType === 'register' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Bulk Register
          </Button>

          {isEventEnded && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => attFileInputRef.current?.click()}
              disabled={loadingType !== null}
              className="border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
            >
              {loadingType === 'attendance' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircleIcon className="w-4 h-4 mr-2" />}
              Bulk Mark Attended
            </Button>
          )}

          <input type="file" ref={regFileInputRef} onChange={e => processFile(e, 'register')} accept=".xlsx,.xls,.csv" className="hidden" />
          <input type="file" ref={attFileInputRef} onChange={e => processFile(e, 'attendance')} accept=".xlsx,.xls,.csv" className="hidden" />
        </div>
      </div>
    </div>
  );
}

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
