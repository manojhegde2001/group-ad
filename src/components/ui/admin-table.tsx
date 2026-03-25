'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Loader2, ShieldQuestion } from 'lucide-react';

interface Column<T> {
  header: string;
  key: string;
  render?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  rowClassName?: string;
}

export function AdminTable<T extends { id: string | number }>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No results found',
  rowClassName,
}: AdminTableProps<T>) {
  return (
    <Card className="overflow-hidden border-2 border-secondary-50 dark:border-secondary-800 rounded-[2.5rem] shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-50 dark:bg-secondary-800/50 border-b border-secondary-100 dark:border-secondary-800">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-6 py-5 font-black text-[10px] uppercase tracking-widest text-secondary-500",
                    column.headerClassName
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-50 dark:divide-secondary-800">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
                    <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">
                      Processing Data...
                    </p>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <ShieldQuestion className="w-12 h-12 text-secondary-200" />
                    <p className="font-bold text-secondary-400 uppercase text-xs tracking-widest">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "group hover:bg-secondary-50/50 dark:hover:bg-secondary-900/50 transition-colors",
                    rowClassName
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-6 py-5", column.className)}
                    >
                      {column.render ? column.render(item) : (item as any)[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
