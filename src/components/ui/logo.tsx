'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className, iconOnly = false }: LogoProps) {
  // If iconOnly, we want a square logo (logo-small.svg)
  // If not iconOnly, we want the full horizontal logo (logo-full.svg / logo-full-dark.svg)
  
  return (
    <div className={cn(
      'relative flex items-center justify-center select-none shrink-0',
      className
    )}>
      {iconOnly ? (
        <div className="relative w-10 h-10">
          <Image
            src="/auth/logo-small.svg"
            alt="Vrutta Icon"
            fill
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/auth/logo-small-dark.svg"
            alt="Vrutta Icon"
            fill
            className="object-contain hidden dark:block"
            priority
          />
        </div>
      ) : (
        <div className="relative w-40 h-10">
          <Image
            src="/auth/logo-full.svg"
            alt="Vrutta Logo"
            fill
            className="object-contain dark:hidden"
            priority
          />
          <Image
            src="/auth/logo-full-dark.svg"
            alt="Vrutta Logo"
            fill
            className="object-contain hidden dark:block"
            priority
          />
        </div>
      )}
    </div>
  );
}
