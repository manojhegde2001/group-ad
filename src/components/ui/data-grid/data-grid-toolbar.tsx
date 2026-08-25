'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DataGridToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  className?: string;
}

export function DataGridToolbar({ search, filters, className }: DataGridToolbarProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-secondary-200 dark:border-secondary-800 shadow-sm',
        className
      )}
    >
      {search && <div className="md:col-span-2">{search}</div>}
      {filters}
    </div>
  );
}
