import { ComponentType, ReactNode } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface DataGridSortState {
  key: string | null;
  direction: SortDirection;
}

export interface DataGridColumn<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  /** Value used for sorting; defaults to reading `item[key]`. */
  accessor?: (item: T) => string | number | Date | null | undefined;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

export interface DataGridAction<T> {
  key: string;
  /** Visible text; when omitted the action renders as an icon-only button. */
  label?: string;
  /** Tooltip text for icon-only buttons; defaults to `label`. */
  title?: string;
  icon: ComponentType<{ className?: string }>;
  /** Renders as a real link instead of a button. Takes precedence over `onClick`. */
  href?: (item: T) => string;
  /** Open the link in a new tab; defaults to same-tab client navigation. */
  newTab?: boolean;
  onClick?: (item: T) => void;
  show?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  loading?: (item: T) => boolean;
  variant?: 'default' | 'danger' | 'success' | 'primary';
}

export interface DataGridExpandable<T> {
  render: (item: T) => ReactNode;
  isExpandable?: (item: T) => boolean;
}
