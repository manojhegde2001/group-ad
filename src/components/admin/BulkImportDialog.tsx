'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  X, Upload, Download, FileSpreadsheet, Loader2, 
  CheckCircle2, AlertCircle, ShieldAlert, ChevronRight, UserPlus,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Modal, Button } from 'rizzui';
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

  const downloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Onboarding Template');

    // Define columns
    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Password', key: 'password', width: 15 },
      { header: 'UserType', key: 'userType', width: 15 },
      { header: 'CategoryName', key: 'categoryName', width: 20 },
    ];

    // Add some sample data
    worksheet.addRow({ name: 'John Doe', username: 'johndoe', email: 'john@example.com', password: 'Password123', userType: 'INDIVIDUAL', categoryName: 'Tech' });
    worksheet.addRow({ name: 'Jane Business', username: 'janebiz', email: 'jane@business.com', password: 'Secure@2024', userType: 'BUSINESS', categoryName: 'Fashion' });

    // Stylize headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEFEFEF' }
    };

    // Add Data Validations (Dropdowns)
    const typeList = ['INDIVIDUAL', 'BUSINESS'];
    const categoryList = categories.map(c => c.name);

    // Apply validations to rows 2 to 100 for UserType (Column E) and CategoryName (Column F)
    for (let i = 2; i <= 100; i++) {
      worksheet.getCell(`E${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${typeList.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Invalid Type',
        error: 'Please select from the dropdown'
      };

      if (categoryList.length > 0) {
        worksheet.getCell(`F${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${categoryList.join(',')}"`],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select an active category from the dropdown'
        };
      }
    }

    // Generate buffer and save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'GroupAd_Bulk_Template.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);

    toast.success('Professional template with dropdowns downloaded');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="flex items-center justify-center p-4"
    >
      <Card className="w-full max-w-4xl bg-white dark:bg-secondary-950 rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] border-2 border-secondary-50 dark:border-secondary-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 md:p-6 flex items-center justify-between border-b border-secondary-100 dark:border-secondary-900 bg-secondary-50/20 dark:bg-secondary-900/40">
           <div>
              <h2 className="text-lg md:text-xl font-bold text-secondary-900 dark:text-white">
                 {step === 1 && "Bulk Import"}
                 {step === 2 && "Review Users"}
                 {step === 3 && "Import Complete"}
              </h2>
           </div>
           <button onClick={onClose} className="p-1.5 hover:bg-secondary-200/50 dark:hover:bg-secondary-800 rounded-lg transition-all">
              <X className="w-5 h-5 text-secondary-400" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5 md:p-6 relative">
          {step === 1 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-xl">
                  {/* Template Card */}
                  <div className="p-6 bg-secondary-50/50 dark:bg-secondary-900/30 border border-secondary-200 dark:border-secondary-800 rounded-2xl transition-all">
                     <h3 className="font-bold text-secondary-900 dark:text-white mb-1">Template</h3>
                     <p className="text-xs text-secondary-500 mb-4">Download the Excel format.</p>
                     <Button 
                       variant="outline" 
                       size="sm"
                       onClick={downloadTemplate}
                       className="w-full rounded-xl font-bold border-secondary-200"
                     >
                        Download
                     </Button>
                  </div>

                  {/* Upload Card */}
                  <div className="p-6 bg-primary-500 rounded-2xl text-white">
                     <h3 className="font-bold mb-1">Upload</h3>
                     <p className="text-xs text-white/70 mb-4">Select your filled-out file.</p>
                     <Button 
                       size="sm"
                       disabled={loading}
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full bg-white text-primary-600 hover:bg-primary-50 rounded-xl font-bold border-none"
                     >
                        {loading ? "..." : "Select File"}
                     </Button>
                     <input type="file" hidden ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleFileUpload} />
                  </div>
               </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 h-full flex flex-col">
               <div className="flex-1 overflow-hidden border border-secondary-100 dark:border-secondary-800 rounded-2xl bg-white dark:bg-secondary-950">
                  <div className="overflow-auto h-full">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                       <thead className="sticky top-0 z-[20]">
                          <tr className="bg-secondary-50 dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800">
                             <th className="px-4 py-3 w-10">
                                <Checkbox 
                                  checked={data.length > 0 && data.every(d => d.selected)}
                                  onChange={(e: any) => setData(data.map(d => ({ ...d, selected: e.target.checked })))}
                                />
                             </th>
                             <th className="px-3 py-3 font-bold text-[10px] text-secondary-500 uppercase tracking-wider">User</th>
                             <th className="px-3 py-3 font-bold text-[10px] text-secondary-500 uppercase tracking-wider">Type</th>
                             <th className="px-3 py-3 font-bold text-[10px] text-secondary-500 uppercase tracking-wider">Category</th>
                             <th className="px-4 py-3 font-bold text-[10px] text-secondary-500 uppercase tracking-wider text-right">Status</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-secondary-50 dark:divide-secondary-900">
                           {data.map((row, i) => (
                             <tr key={i} className={cn("transition-colors", !row.isValid ? "bg-red-500/5" : "hover:bg-secondary-50/50 dark:hover:bg-secondary-900/30")}>
                                <td className="px-4 py-3">
                                   <Checkbox 
                                     checked={row.selected}
                                     onChange={(e: any) => updateRowField(i, 'selected', e.target.checked)}
                                   />
                                </td>
                                <td className="px-3 py-3">
                                   <div className="min-w-0">
                                      <p className="font-bold text-secondary-900 dark:text-white truncate text-sm leading-tight">{row.name}</p>
                                      <p className="text-[10px] text-secondary-400 truncate tracking-tight">{row.email}</p>
                                   </div>
                                </td>
                                <td className="px-3 py-3">
                                   <div className="w-28">
                                      <Select 
                                        size="sm"
                                        rounded="sm"
                                        value={row.userType} 
                                        onChange={(val) => updateRowField(i, 'userType', val)}
                                        options={[
                                          { label: 'INDIVIDUAL', value: 'INDIVIDUAL' },
                                          { label: 'BUSINESS', value: 'BUSINESS' },
                                        ]}
                                      />
                                   </div>
                                </td>
                                <td className="px-3 py-3">
                                   <div className="w-36">
                                      <Select 
                                        size="sm"
                                        rounded="sm"
                                        value={row.categoryId} 
                                        onChange={(val) => updateRowField(i, 'categoryId', val)}
                                        options={[
                                          { label: 'None', value: 'NONE' },
                                          ...categories.map(c => ({ label: c.name, value: c.id }))
                                        ]}
                                      />
                                   </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                   {row.isValid ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
                                   ) : (
                                      <div className="flex flex-col items-end gap-0.5">
                                         {row.errors.map((err, ei) => (
                                            <span key={ei} className="text-red-500 font-bold text-[9px] uppercase tracking-tight">
                                               {err}
                                            </span>
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
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
               <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
               </div>
               <div className="space-y-1">
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white">Imported Successfully</h3>
                  <p className="text-secondary-500 text-xs font-medium">{data.filter(u => u.isValid).length} users have been added to your platform.</p>
               </div>
               <Button 
                size="sm"
                onClick={onClose} 
                className="rounded-xl px-8 font-bold mt-4"
              >
                  Close
               </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-5 md:p-6 bg-secondary-50/50 dark:bg-secondary-900/50 border-t border-secondary-100 dark:border-secondary-800 flex items-center justify-between gap-4">
             <button onClick={() => setStep(1)} className="text-xs font-bold text-secondary-400 hover:text-secondary-600 transition-colors">
                ← Back
             </button>
             <Button 
               onClick={executeImport}
               disabled={loading || data.filter(u => u.isValid && u.selected).length === 0}
               className="rounded-xl h-10 px-6 bg-primary-500 hover:bg-primary-600 font-bold text-white text-xs border-none"
             >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                Create {data.filter(u => u.isValid && u.selected).length} Users
             </Button>
          </div>
        )}
      </Card>
    </Modal>
  );
}
