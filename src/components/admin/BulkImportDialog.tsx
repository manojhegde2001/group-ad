'use client';

import { useState, useRef } from 'react';
import { 
  X, Upload, Download, FileSpreadsheet, Loader2, 
  CheckCircle2, AlertCircle, ShieldAlert, ChevronRight, UserPlus
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BulkUserResult {
  name: string;
  username: string;
  email: string;
  password?: string;
  userType?: string;
  isValid: boolean;
  errors: string[];
}

export default function BulkImportDialog({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: () => void, onRefresh: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview/Fix, 3: Success
  const [data, setData] = useState<BulkUserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['Name', 'Username', 'Email', 'Password', 'UserType (INDIVIDUAL/BUSINESS)'];
    const csvContent = headers.join(',') + '\nJohn Doe,johndoe,john@example.com,Password123,INDIVIDUAL';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_users_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Map to expected format
        const mappedData = rawData.map((row: any) => ({
          name: row.Name || row.name,
          username: row.Username || row.username,
          email: row.Email || row.email,
          password: row.Password || row.password || 'Temporary@123',
          userType: (row.UserType || row.userType || 'INDIVIDUAL').toUpperCase(),
        }));

        // Send for validation
        const res = await fetch('/api/admin/users/bulk/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: mappedData })
        });
        
        const result = await res.json();
        if (res.ok) {
          setData(result.results);
          setStep(2);
        } else {
          toast.error(result.error || 'Failed to validate file');
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error('Failed to parse file');
    } finally {
      setLoading(false);
    }
  };

  const executeImport = async () => {
    const validUsers = data.filter(u => u.isValid);
    if (validUsers.length === 0) {
      toast.error('No valid users to import');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: validUsers })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(result.message);
        setStep(3);
        onRefresh();
      } else {
        toast.error(result.error || 'Bulk creation failed');
      }
    } catch {
      toast.error('Internal server error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl bg-white dark:bg-secondary-950 rounded-[3rem] shadow-2xl border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-secondary-100 dark:border-secondary-900 bg-secondary-50/30 dark:bg-secondary-900/20">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 ring-2 ring-primary-100 dark:ring-primary-900/30">
                 {step === 3 ? <CheckCircle2 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
              <div>
                 <h2 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">
                    {step === 1 && "Bulk Onboarding"}
                    {step === 2 && "Data Review"}
                    {step === 3 && "Import Successful"}
                 </h2>
                 <p className="text-xs font-bold text-secondary-400 tracking-widest uppercase mt-0.5">
                    {step === 1 && "Onboard hundreds of users instantly"}
                    {step === 2 && `Reviewing ${data.length} potential accounts`}
                    {step === 3 && "Account creation complete"}
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-2.5 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl transition-all">
              <X className="w-6 h-6 text-secondary-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-10">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  {/* Download Template */}
                  <button 
                    onClick={downloadTemplate}
                    className="group p-8 bg-secondary-50 dark:bg-secondary-900 border-2 border-dashed border-secondary-100 dark:border-secondary-800 rounded-[2.5rem] hover:border-primary-500 transition-all text-center space-y-4"
                  >
                     <div className="w-16 h-16 bg-white dark:bg-secondary-800 rounded-3xl mx-auto flex items-center justify-center text-secondary-400 group-hover:text-primary-500 shadow-sm transition-colors ring-4 ring-secondary-50/50 dark:ring-secondary-900/50">
                        <Download className="w-8 h-8" />
                     </div>
                     <div>
                        <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight">Get Template</p>
                        <p className="text-xs text-secondary-500 mt-1">Download CSV structure with proper headers</p>
                     </div>
                  </button>

                  {/* Upload File */}
                  <button 
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="group p-8 bg-primary-500 rounded-[2.5rem] hover:bg-primary-600 transition-all text-center space-y-4 text-white shadow-xl shadow-primary-500/20"
                  >
                     <div className="w-16 h-16 bg-white/20 rounded-3xl mx-auto flex items-center justify-center text-white shadow-inner">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                     </div>
                     <div>
                        <p className="font-black uppercase tracking-tight">Upload Sheet</p>
                        <p className="text-xs text-white/70 mt-1">Select Excel or CSV file to parse</p>
                     </div>
                     <input type="file" hidden ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </button>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                  <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed uppercase tracking-tight">
                    Review flagged rows before proceeding. Duplicate emails or invalid formats will be skipped automatically.
                  </p>
               </div>

               <div className="border border-secondary-100 dark:border-secondary-800 rounded-[2rem] overflow-hidden bg-white dark:bg-secondary-900 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                       <thead>
                          <tr className="bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
                             <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-secondary-400">User Data</th>
                             <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-secondary-400 text-center">Type</th>
                             <th className="px-6 py-4 font-black uppercase text-[10px] tracking-widest text-secondary-400">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
                          {data.map((row, i) => (
                             <tr key={i} className={cn("transition-colors", !row.isValid ? "bg-red-50/30 dark:bg-red-900/10" : "hover:bg-secondary-50/50 dark:hover:bg-secondary-800/20")}>
                                <td className="px-6 py-4 py-5">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-secondary-100 dark:bg-secondary-800 rounded-lg flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                      <div>
                                         <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight">{row.name}</p>
                                         <p className="text-[10px] font-bold text-secondary-400 tracking-tight">@{row.username} • {row.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                   <span className="text-[9px] font-black uppercase tracking-widest text-secondary-500 bg-secondary-100 dark:bg-secondary-800 px-2 py-1 rounded-md">{row.userType}</span>
                                </td>
                                <td className="px-6 py-4">
                                   {row.isValid ? (
                                      <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                                         <CheckCircle2 className="w-3 h-3" /> Ready
                                      </div>
                                   ) : (
                                      <div className="space-y-1">
                                         {row.errors.map((err, ei) => (
                                            <div key={ei} className="flex items-center gap-1.5 text-red-500 font-bold text-[10px] uppercase tracking-widest bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-800/50">
                                               <AlertCircle className="w-3 h-3" /> {err}
                                            </div>
                                         ))}
                                      </div>
                                   )}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in zoom-in duration-500">
               <div className="w-32 h-32 bg-emerald-500 rounded-[3rem] shadow-2xl shadow-emerald-500/30 flex items-center justify-center text-white relative">
                  <CheckCircle2 className="w-16 h-16" />
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-white dark:bg-secondary-950 rounded-2xl flex items-center justify-center text-emerald-500 shadow-lg border-2 border-emerald-500">
                     <p className="font-black text-sm">+{data.filter(u => u.isValid).length}</p>
                  </div>
               </div>
               <div className="max-w-xs">
                  <h3 className="text-3xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase">Mission Complete!</h3>
                  <p className="text-secondary-500 font-medium mt-2">All valid users have been successfully established in the database workspace.</p>
               </div>
               <Button onClick={onClose} className="rounded-2xl h-12 px-10 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black uppercase tracking-widest shadow-xl">
                  Close Dashboard
               </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-6 md:p-8 bg-secondary-50 dark:bg-secondary-900/50 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-4">
             <button onClick={() => setStep(1)} className="text-xs font-black uppercase tracking-widest text-secondary-400 hover:text-secondary-900 dark:hover:text-white transition-colors">
                ← Start Over
             </button>
             <div className="flex gap-4 items-center">
                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest hidden md:block">
                   Valid: {data.filter(u => u.isValid).length} / {data.length} Total
                </p>
                <Button 
                  onClick={executeImport}
                  disabled={loading || data.filter(u => u.isValid).length === 0}
                  className="rounded-2xl h-12 px-8 bg-primary-500 hover:bg-primary-600 font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20"
                >
                   {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                   Confirm & Establish Users
                </Button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
}
