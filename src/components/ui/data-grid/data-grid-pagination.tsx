'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Select } from '@/components/ui/select';

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

interface DataGridPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export function DataGridPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  itemLabel = 'results',
}: DataGridPaginationProps) {
  const pages = Math.max(totalPages, 1);

  const navBtn = 'w-8 h-8 flex items-center justify-center rounded-md border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-900 text-secondary-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-colors';

  return (
    <div className="px-4 py-3 bg-secondary-50 dark:bg-secondary-800/40 border-t border-secondary-200 dark:border-secondary-700 flex flex-col sm:flex-row items-center justify-between gap-3">
      {onPageSizeChange ? (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary-400 uppercase tracking-wide">Rows per page</span>
          <Select
            value={String(pageSize)}
            onChange={(val: string) => onPageSizeChange(Number(val))}
            options={pageSizeOptions.map((size) => ({ label: String(size), value: String(size) }))}
            size="sm"
            rounded="sm"
            className="w-20"
          />
        </div>
      ) : (
        <p className="text-xs font-semibold text-secondary-400 uppercase tracking-wide">
          {total} {itemLabel}
        </p>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-secondary-500 dark:text-secondary-400">
          Page {page} of {pages}
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(1)} disabled={page === 1} className={navBtn} title="First page">
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className={navBtn} title="Previous page">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page === pages} className={navBtn} title="Next page">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => onPageChange(pages)} disabled={page === pages} className={navBtn} title="Last page">
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
