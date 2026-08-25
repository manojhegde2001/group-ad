import { useMemo, useState } from 'react';
import { DataGridColumn, DataGridSortState } from './types';

export function useDataGridSort<T>(data: T[], columns: DataGridColumn<T>[]) {
  const [sort, setSort] = useState<DataGridSortState>({ key: null, direction: null });

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: null, direction: null };
    });
  };

  const sortedData = useMemo(() => {
    if (!sort.key || !sort.direction) return data;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return data;
    const getValue = column.accessor ?? ((item: T) => (item as any)[column.key]);
    const direction = sort.direction;

    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;

      let cmp: number;
      if (va instanceof Date || vb instanceof Date) {
        cmp = new Date(va as any).getTime() - new Date(vb as any).getTime();
      } else if (typeof va === 'number' && typeof vb === 'number') {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb), undefined, { numeric: true, sensitivity: 'base' });
      }
      return direction === 'asc' ? cmp : -cmp;
    });
  }, [data, sort, columns]);

  return { sort, toggleSort, sortedData };
}
