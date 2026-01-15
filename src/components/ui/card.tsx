'use client';

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outline' | 'flat';
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Card({
  children,
  variant = 'elevated',
  className,
  header,
  footer,
}: CardProps) {
  const variants = {
    elevated: 'shadow-lg bg-white dark:bg-secondary-800',
    outline: 'border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800',
    flat: 'bg-secondary-50 dark:bg-secondary-900',
  };

  return (
    <div className={cn('rounded-lg overflow-hidden', variants[variant], className)}>
      {header && (
        <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
          {header}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900">
          {footer}
        </div>
      )}
    </div>
  );
}
