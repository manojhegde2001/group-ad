'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2, Building, Building2, Target, FileText, Info } from 'lucide-react';
import { useSubmitTypeChangeRequest } from '@/hooks/use-api/use-user';
import { useCategories } from '@/hooks/use-api/use-categories';
import { Select } from 'rizzui';

type ConvertToBusinessModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ConvertToBusinessModal({ isOpen, onClose }: ConvertToBusinessModalProps) {
  const submitMutation = useSubmitTypeChangeRequest();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.categories || [];

  const [formData, setFormData] = useState({
    companyName: '',
    categoryId: '',
    gstNumber: '',
    reason: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.categoryId) return;
    
    submitMutation.mutate(formData, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary-900/40 dark:bg-secondary-950/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md bg-white dark:bg-secondary-900 rounded-[2rem] p-6 sm:p-8 border border-secondary-200 dark:border-secondary-800 shadow-2xl overflow-hidden"
          >
            {/* Decorative BG */}
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-400/20 rounded-full blur-[60px] pointer-events-none" />

            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-secondary-400 hover:text-secondary-900 dark:hover:text-white bg-secondary-100 dark:bg-secondary-800 rounded-full transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/40 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-primary-100 dark:border-primary-800/50">
                <Zap className="w-8 h-8 text-primary-500 fill-primary-500/20" />
              </div>
              <h3 className="text-2xl font-black text-secondary-900 dark:text-white uppercase tracking-tight mb-2">
                Go Business
              </h3>
              <p className="text-sm font-medium text-secondary-600 dark:text-secondary-400">
                Unlock enterprise connections, advanced analytics, and priority placement.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-widest mb-1.5 ml-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-400">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    required
                    type="text"
                    value={formData.companyName}
                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-900 transition-all"
                    placeholder="Enter your company name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-widest mb-1.5 ml-1">
                  Business Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Select
                    options={categories.map(c => ({ label: c.name, value: c.id }))}
                    value={categories.find(c => c.id === formData.categoryId) ? { label: categories.find(c => c.id === formData.categoryId)?.name, value: formData.categoryId } : null}
                    onChange={(selected: any) => {
                      setFormData({ ...formData, categoryId: selected?.value || selected })
                    }}
                    placeholder="Select Category"
                    searchable={true}
                    selectClassName="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-xl py-3 text-sm font-semibold text-secondary-900 dark:text-white focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 transition-all"
                    dropdownClassName="p-2 z-[9999]"
                    optionClassName="hover:bg-primary-50 dark:hover:bg-primary-900/20 py-2 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-widest mb-1.5 ml-1">
                  GST Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-secondary-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-900 transition-all"
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary-700 dark:text-secondary-300 uppercase tracking-widest mb-1.5 ml-1">
                  Reason for converting <span className="text-secondary-400 normal-case tracking-normal font-medium">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute top-3 left-0 pl-4 flex items-start pointer-events-none text-secondary-400">
                    <Info className="w-4 h-4" />
                  </div>
                  <textarea
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-900 transition-all resize-none"
                    rows={3}
                    placeholder="Tell us why you want to become a Business account..."
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitMutation.isPending || !formData.companyName || !formData.categoryId}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Submit Request'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
