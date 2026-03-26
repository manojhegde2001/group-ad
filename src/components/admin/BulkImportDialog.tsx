'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Download, FileSpreadsheet, Loader2, 
  CheckCircle2, AlertCircle, ShieldAlert, ChevronRight, UserPlus,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import toast from 'react-hot-toast';

interface BulkUserResult {
  name: string;
  username: string;
  email: string;
  password?: string;
  userType: string;
  categoryId?: string;
  isValid: boolean;
  errors: string[];
  selected?: boolean;
}

export default function BulkImportDialog({ isOpen, onClose, onRefresh }: { isOpen: boolean, onClose: () => void, onRefresh: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview, 3: Success
  const [data, setData] = useState<BulkUserResult[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/categories')
        .then(r => r.json())
        .then(d => setCategories(d.categories || []))
        .catch(() => {});
    }
  }, [isOpen]);

  const downloadTemplate = () => {
    // Standardized Template: Fixed headers and sample data
    const wsData = [
      ['Name', 'Username', 'Email', 'Password', 'UserType', 'CategoryName'],
      ['John Doe', 'johndoe', 'john@example.com', 'Password123', 'INDIVIDUAL', 'Tech'],
      ['Jane Business', 'janebiz', 'jane@business.com', 'Secure@2024', 'BUSINESS', 'Fashion'],
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Template');

    // Add Reference Sheet for Categories & Types
    const refData = [
      ['VALID ACCOUNT TYPES', '', 'CURRENT CATEGORIES'],
      ['INDIVIDUAL', '', ...categories.map(c => c.name)],
      ['BUSINESS', '', ''],
    ];
    const refWs = XLSX.utils.aoa_to_sheet(refData);
    XLSX.utils.book_append_sheet(wb, refWs, 'Data-Reference');

    XLSX.writeFile(wb, 'GroupAd_Bulk_Template.xlsx');
    toast.success('Professional template with references downloaded');
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

        if (rawData.length === 0) {
          toast.error('The uploaded file is empty');
          setLoading(false);
          return;
        }

        // Map to internal format with strict field mapping
        const mappedData = rawData.map((row: any) => {
          const catName = row.CategoryName || row.categoryName || row.Category || '';
          const category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          
          return {
            name: String(row.Name || row.name || '').trim(),
            username: String(row.Username || row.username || '').trim().toLowerCase(),
            email: String(row.Email || row.email || '').trim().toLowerCase(),
            password: String(row.Password || row.password || 'Temp@123').trim(),
            userType: (String(row.UserType || row.userType || 'INDIVIDUAL')).toUpperCase(),
            categoryId: category?.id || 'NONE',
            isValid: false,
            errors: [],
          };
        });

        // Validate via API
        const res = await fetch('/api/admin/users/bulk/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ users: mappedData })
        });
        
        const result = await res.json();
        if (res.ok) {
          setData(result.results.map((u: any) => ({ ...u, selected: true })));
          setStep(2);
        } else {
          toast.error(result.error || 'Validation server error');
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      toast.error('Critical: Failed to parse spreadsheet');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateRowField = (index: number, field: keyof BulkUserResult, value: any) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    setData(newData);
  };

  const executeImport = async () => {
    const validUsers = data.filter(u => u.isValid && u.selected);
    if (validUsers.length === 0) {
      toast.error('No valid accounts selected for deployment');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/users/bulk/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: validUsers })
      });

      if (res.ok) {
        setStep(3);
        onRefresh();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Deployment failed');
      }
    } catch {
      toast.error('Network error during deployment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-secondary-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="w-full max-w-4xl bg-white dark:bg-secondary-950 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-secondary-100 dark:border-secondary-900 bg-secondary-50/40 dark:bg-secondary-900/40">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20 ring-4 ring-primary-50 dark:ring-primary-900/20 text-white">
                 {step === 3 ? <CheckCircle2 className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
              </div>
              <div>
                 <h2 className="text-xl md:text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tighter">
                    {step === 1 && "Bulk Deployment"}
                    {step === 2 && "Identity Review"}
                    {step === 3 && "Workspace Updated"}
                 </h2>
                 <p className="text-[10px] font-black text-secondary-400 tracking-[0.3em] uppercase mt-1">
                    {step === 1 && "Standardized Onboarding Protocol"}
                    {step === 2 && `Validating ${data.length} Security Identities`}
                    {step === 3 && "Accounts Synchronized Successfully"}
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-3xl transition-all active:scale-90">
              <X className="w-7 h-7 text-secondary-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8 relative">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  <button 
                    onClick={downloadTemplate}
                    className="group relative p-8 bg-secondary-50 dark:bg-secondary-900 border-2 border-dashed border-secondary-200 dark:border-secondary-700 rounded-3xl hover:border-primary-500 hover:bg-white dark:hover:bg-secondary-800 transition-all duration-300 text-center space-y-4"
                  >
                     <div className="w-16 h-16 bg-white dark:bg-secondary-800 rounded-2xl mx-auto flex items-center justify-center text-secondary-300 group-hover:text-primary-500 shadow-lg group-hover:shadow-primary-500/10 transition-all ring-8 ring-secondary-50/50 dark:ring-secondary-900/50 group-hover:ring-primary-50 group-hover:dark:ring-primary-900/20">
                        <Download className="w-7 h-7" />
                     </div>
                     <div>
                        <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight text-base">Download Template</p>
                        <p className="text-[10px] font-bold text-secondary-400 mt-2 uppercase tracking-widest">Restricted Excel Format</p>
                     </div>
                  </button>

                  <button 
                    disabled={loading}
                    onClick={() => fileInputRef.current?.click()}
                    className="group p-8 bg-primary-500 rounded-3xl hover:bg-primary-600 transition-all duration-300 text-center space-y-4 text-white shadow-2xl shadow-primary-500/30 active:scale-95"
                  >
                     <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto flex items-center justify-center text-white shadow-inner backdrop-blur-sm group-hover:scale-110 transition-transform">
                        {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <FileSpreadsheet className="w-8 h-8" />}
                     </div>
                     <div>
                        <p className="font-black uppercase tracking-tight text-base">Initialize Upload</p>
                        <p className="text-[10px] font-black text-white/50 mt-2 uppercase tracking-widest">Supports .XLSX, .CSV</p>
                     </div>
                     <input type="file" hidden ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </button>
               </div>
               
               <div className="p-6 bg-secondary-50 dark:bg-secondary-900/50 rounded-3xl border border-secondary-100 dark:border-secondary-800 max-w-xl">
                  <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] leading-relaxed text-center">
                    Security Protocol: All passwords are encrypted on creation. Emails must be unique. Workspace categories are auto-mapped based on template names.
                  </p>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 h-full flex flex-col">
               <div className="flex items-center gap-5 p-5 bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/20 rounded-[2rem]">
                  <ShieldAlert className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Manual Verification Required</p>
                    <p className="text-[10px] font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-widest mt-0.5">
                      Review types and categories below. Red rows contain critical validation errors.
                    </p>
                  </div>
               </div>

               <div className="flex-1 overflow-hidden border-2 border-secondary-50 dark:border-secondary-900 rounded-[2.5rem] bg-white dark:bg-secondary-950 shadow-inner">
                  <div className="overflow-auto h-full scrollbar-hide">
                    <table className="w-full text-left border-collapse">
                       <thead className="sticky top-0 z-10">
                          <tr className="bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800">
                             <th className="px-6 py-5">
                                <Checkbox 
                                  checked={data.length > 0 && data.every(d => d.selected)}
                                  onChange={(e) => setData(data.map(d => ({ ...d, selected: e.target.checked })))}
                                />
                             </th>
                             <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-secondary-400">Identity Details</th>
                             <th className="px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-secondary-400">Account Type</th>
                             <th className="px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-secondary-400">Category</th>
                             <th className="px-8 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-secondary-400">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-secondary-50 dark:divide-secondary-900">
                           {data.map((row, i) => (
                             <tr key={i} className={cn("transition-colors group", !row.isValid ? "bg-red-50/30 dark:bg-red-900/10" : "hover:bg-secondary-50/50 dark:hover:bg-secondary-900/30")}>
                                <td className="px-6 py-4">
                                   <Checkbox 
                                     checked={row.selected}
                                     onChange={(e) => updateRowField(i, 'selected', e.target.checked)}
                                   />
                                </td>
                                <td className="px-8 py-6">
                                   <div className="flex items-center gap-4">
                                      <div className="w-10 h-10 bg-secondary-100 dark:bg-secondary-800 rounded-xl flex items-center justify-center text-xs font-black text-secondary-400 group-hover:text-primary-500 transition-colors shadow-sm">{i + 1}</div>
                                      <div className="min-w-0">
                                         <p className="font-black text-secondary-900 dark:text-white uppercase tracking-tight truncate">{row.name}</p>
                                         <p className="text-[10px] font-bold text-secondary-400 tracking-tight truncate">@{row.username} • {row.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="w-36">
                                      <Select 
                                        size="sm"
                                        rounded="lg"
                                        value={row.userType} 
                                        onChange={(val) => updateRowField(i, 'userType', val)}
                                        options={[
                                          { label: 'INDIVIDUAL', value: 'INDIVIDUAL' },
                                          { label: 'BUSINESS', value: 'BUSINESS' },
                                        ]}
                                      />
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="w-48">
                                      <Select 
                                        size="sm"
                                        rounded="lg"
                                        value={row.categoryId} 
                                        onChange={(val) => updateRowField(i, 'categoryId', val)}
                                        options={[
                                          { label: 'None', value: 'NONE' },
                                          ...categories.map(c => ({ label: c.name.toUpperCase(), value: c.id }))
                                        ]}
                                      />
                                   </div>
                                </td>
                                <td className="px-8 py-4">
                                   {row.isValid ? (
                                      <div className="inline-flex items-center gap-2 text-emerald-500 dark:text-emerald-400 font-black text-[10px] uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                         <CheckCircle2 className="w-3.5 h-3.5" /> SECURE
                                      </div>
                                   ) : (
                                      <div className="space-y-1.5 min-w-[150px]">
                                         {row.errors.map((err, ei) => (
                                            <div key={ei} className="inline-flex items-center gap-2 text-red-500 font-black text-[9px] uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-lg border border-red-100 dark:border-red-800/40">
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
            <div className="flex flex-col items-center justify-center h-full text-center space-y-8 animate-in zoom-in duration-500 py-20">
               <div className="relative">
                  <div className="w-40 h-40 bg-emerald-500 rounded-[3.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center justify-center text-white scale-110 active:scale-100 transition-transform">
                     <CheckCircle2 className="w-20 h-20" />
                  </div>
                  <div className="absolute -top-4 -right-4 w-14 h-14 bg-white dark:bg-secondary-900 rounded-[1.5rem] flex items-center justify-center text-emerald-500 shadow-2xl border-4 border-emerald-500 ring-8 ring-white/10">
                     <p className="font-black text-lg">+{data.filter(u => u.isValid).length}</p>
                  </div>
               </div>
               <div className="max-w-md space-y-4">
                  <h3 className="text-4xl font-black text-secondary-900 dark:text-white tracking-tighter uppercase leading-none">Onboarding Complete</h3>
                  <p className="text-secondary-500 font-bold uppercase text-[10px] tracking-[0.2em] opacity-70">New professional identities have been successfully synchronized with the primary workspace architecture.</p>
               </div>
               <Button onClick={onClose} className="rounded-[1.5rem] h-14 px-12 bg-secondary-900 dark:bg-white text-white dark:text-secondary-900 font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-transform">
                  Dismiss Workspace
               </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-8 md:p-10 bg-secondary-50 dark:bg-secondary-900 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-6">
             <button onClick={() => setStep(1)} className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-400 hover:text-primary-500 transition-colors flex items-center gap-2">
                ← Reset Protocol
             </button>
             <div className="flex gap-6 items-center">
                <div className="hidden md:flex flex-col items-end">
                   <p className="text-[10px] font-black text-secondary-900 dark:text-white uppercase tracking-widest">Selected Capacity</p>
                   <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">{data.filter(u => u.isValid).length} / {data.length} Deployable</p>
                </div>
                <Button 
                  onClick={executeImport}
                  disabled={loading || data.filter(u => u.isValid).length === 0}
                  className="rounded-[1.5rem] h-14 px-10 bg-primary-500 hover:bg-primary-600 font-black uppercase tracking-widest text-white shadow-2xl shadow-primary-500/30 group"
                >
                   {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <ChevronRight className="w-6 h-6 mr-3 group-hover:translate-x-1 transition-transform" />}
                   Finalize Deployment
                </Button>
             </div>
          </div>
        )}
      </Card>
    </div>
  );
}
