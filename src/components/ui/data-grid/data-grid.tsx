'use client';

import { Fragment, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpDown, ChevronDown, ChevronUp, ChevronRight, Loader2, ShieldQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { DataGridAction, DataGridColumn, DataGridExpandable, DataGridSortState } from './types';
import { useDataGridSort } from './use-data-grid-sort';

const ACTION_VARIANT_CLASSES: Record<NonNullable<DataGridAction<any>['variant']>, string> = {
  default:
    'bg-white dark:bg-secondary-900 text-secondary-500 dark:text-secondary-400 hover:bg-primary hover:text-white hover:border-primary border-secondary-200 dark:border-secondary-700',
  danger:
    'bg-white dark:bg-secondary-900 text-red-500 dark:text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 border-secondary-200 dark:border-secondary-700',
  success:
    'bg-white dark:bg-secondary-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 border-secondary-200 dark:border-secondary-700',
  primary:
    'bg-white dark:bg-secondary-900 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 border-secondary-200 dark:border-secondary-700',
};

function ActionButton<T>({ action, item }: { action: DataGridAction<T>; item: T }) {
  const Icon = action.icon;
  const isLoading = action.loading?.(item) ?? false;
  const isDisabled = isLoading || (action.disabled?.(item) ?? false);
  const variantClass = ACTION_VARIANT_CLASSES[action.variant ?? 'default'];
  const className = cn(
    'flex items-center justify-center gap-1.5 rounded-md border transition-colors active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed font-semibold',
    action.label ? 'h-8 px-3 text-xs' : 'w-8 h-8',
    variantClass
  );
  const content = (
    <>
      {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className="w-3.5 h-3.5" />}
      {action.label && <span>{action.label}</span>}
    </>
  );

  if (action.href) {
    return (
      <Link
        href={action.href(item)}
        target={action.newTab ? '_blank' : undefined}
        rel={action.newTab ? 'noopener noreferrer' : undefined}
        title={action.title ?? action.label ?? action.key}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={() => action.onClick?.(item)}
      disabled={isDisabled}
      title={action.title ?? action.label ?? action.key}
      className={className}
    >
      {content}
    </button>
  );
}

function SortIcon({ direction }: { direction: DataGridSortState['direction'] }) {
  if (direction === 'asc') return <ChevronUp className="w-3.5 h-3.5" />;
  if (direction === 'desc') return <ChevronDown className="w-3.5 h-3.5" />;
  return <ArrowUpDown className="w-3 h-3 opacity-40" />;
}

interface DataGridProps<T> {
  columns: DataGridColumn<T>[];
  data: T[];
  loading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  getRowId: (item: T) => string | number;
  actions?: DataGridAction<T>[];
  expandable?: DataGridExpandable<T>;
  expandedRowId?: string | number | null;
  onToggleExpand?: (id: string | number) => void;
  /** Rendered inside the same card, below the table body — typically pagination. */
  footer?: ReactNode;
  className?: string;
}

export function DataGrid<T>({
  columns,
  data,
  loading = false,
  loadingMessage = 'Processing Data',
  emptyMessage = 'No results found',
  getRowId,
  actions,
  expandable,
  expandedRowId,
  onToggleExpand,
  footer,
  className,
}: DataGridProps<T>) {
  const { sort, toggleSort, sortedData } = useDataGridSort(data, columns);

  const colCount = columns.length + (actions ? 1 : 0) + (expandable ? 1 : 0);

  return (
    <Card className={cn('overflow-hidden border border-secondary-200 dark:border-secondary-800 rounded-xl shadow-sm bg-white dark:bg-slate-900', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary-50 dark:bg-secondary-800/60 border-b border-secondary-200 dark:border-secondary-700">
              {expandable && <th className="pl-4 pr-1 py-3 w-8" />}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-4 py-3 font-semibold text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center',
                    column.headerClassName
                  )}
                >
                  {column.sortable ? (
                    <button
                      onClick={() => toggleSort(column.key)}
                      className={cn(
                        'inline-flex items-center gap-1 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors',
                        column.align === 'right' && 'flex-row-reverse'
                      )}
                    >
                      {column.header}
                      <SortIcon direction={sort.key === column.key ? sort.direction : null} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-100 dark:divide-secondary-800">
            {loading ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="font-semibold text-secondary-400 uppercase text-xs tracking-wide">{loadingMessage}</p>
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <ShieldQuestion className="w-10 h-10 text-secondary-300" />
                    <p className="font-semibold text-secondary-400 uppercase text-xs tracking-wide">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((item) => {
                const rowId = getRowId(item);
                const canExpand = expandable && (expandable.isExpandable?.(item) ?? true);
                const isExpanded = canExpand && expandedRowId === rowId;

                return (
                  <Fragment key={rowId}>
                    <tr className="group hover:bg-secondary-50/60 dark:hover:bg-secondary-800/30 transition-colors">
                      {expandable && (
                        <td className="pl-4 pr-1 py-3">
                          {canExpand && (
                            <button
                              onClick={() => onToggleExpand?.(rowId)}
                              className="p-1 rounded text-secondary-400 hover:text-primary hover:bg-primary/5 transition-all"
                            >
                              <ChevronRight className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                            </button>
                          )}
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            'px-4 py-3 align-middle',
                            column.align === 'right' && 'text-right',
                            column.align === 'center' && 'text-center',
                            column.className
                          )}
                        >
                          {column.render ? column.render(item) : (item as any)[column.key]}
                        </td>
                      ))}
                      {actions && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {actions
                              .filter((action) => action.show?.(item) ?? true)
                              .map((action) => (
                                <ActionButton key={action.key} action={action} item={item} />
                              ))}
                          </div>
                        </td>
                      )}
                    </tr>
                    {isExpanded && (
                      <tr className="bg-secondary-50/40 dark:bg-secondary-800/20">
                        <td colSpan={colCount} className="px-4 py-5">
                          {expandable!.render(item)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </Card>
  );
}
