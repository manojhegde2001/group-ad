'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type AdminHeaderColor = 'primary' | 'orange' | 'violet' | 'emerald' | 'rose';

const THEME: Record<AdminHeaderColor, { icon: string; accent: string }> = {
  primary: { icon: 'from-primary-400 to-primary-600 shadow-primary-500/20 ring-primary-500/10', accent: 'text-primary italic' },
  orange: { icon: 'from-orange-400 to-rose-600 shadow-orange-500/20 ring-orange-500/10', accent: 'text-orange-500 italic' },
  violet: { icon: 'from-violet-500 to-indigo-600 shadow-violet-500/20 ring-violet-500/10', accent: 'text-violet-500 italic' },
  emerald: { icon: 'from-emerald-500 to-teal-600 shadow-emerald-500/20 ring-emerald-500/10', accent: 'text-emerald-500 italic' },
  rose: { icon: 'from-rose-400 to-pink-600 shadow-rose-500/20 ring-rose-500/10', accent: 'text-rose-500 italic' },
};

interface AdminPageHeaderProps {
  icon: LucideIcon;
  title: string;
  accent: string;
  description?: string;
  color?: AdminHeaderColor;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  icon: Icon,
  title,
  accent,
  description,
  color = 'primary',
  backHref,
  actions,
  className,
}: AdminPageHeaderProps) {
  const theme = THEME[color];

  return (
    <div className={cn(
      "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-secondary-100 dark:border-secondary-900/60",
      className
    )}>
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="flex items-center gap-2 text-[10px] font-black text-secondary-400 hover:text-primary transition-all mb-3 uppercase tracking-[0.2em] group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back to Dashboard
          </Link>
        )}
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg ring-4 shrink-0",
            theme.icon
          )}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-secondary-900 dark:text-white tracking-tight uppercase leading-none mb-1.5">
              {title} <span className={theme.accent}>{accent}</span>
            </h1>
            {description && (
              <p className="text-secondary-400 font-black text-[10px] uppercase tracking-[0.2em] leading-none">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
