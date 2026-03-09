'use client';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3 group select-none py-1', className)}>
      {/* Refined, Minimalist Icon */}
      <div className="relative flex items-center justify-center shrink-0 w-9 h-9 sm:w-10 sm:h-10">
        {/* Background Layer with subtle gradient and glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary-600 to-indigo-500 rounded-xl rotate-3 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-primary-500/20" />

        {/* Secondary decorative layer */}
        <div className="absolute inset-0 bg-white/10 rounded-xl -rotate-3 group-hover:-rotate-12 transition-all duration-700" />

        {/* The "Neat" Icon - Geometric & Balanced */}
        <svg
          viewBox="0 0 24 24"
          className="relative w-5 h-5 sm:w-6 sm:h-6 text-white"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Abstract 'G' + 'A' connection */}
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className="text-lg sm:text-xl font-black tracking-tighter text-secondary-900 dark:text-white flex items-center">
            <span className="text-primary-600">GROUP</span>
            <span className="ml-1 opacity-80">AD</span>
          </span>
          <span className="text-[9px] font-bold text-secondary-400 tracking-[0.2em] uppercase mt-0.5 opacity-60">
            Professional
          </span>
        </div>
      )}
    </div>
  );
}
