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
        <Image
          src="/auth/logo-small.svg"
          alt="Logo"
          width={40}
          height={40}
          className="w-full h-full object-contain"
          priority
        />
      ) : (
        <>
          <Image
            src="/auth/logo-full.svg"
            alt="Logo"
            width={160}
            height={48}
            className="w-auto h-full object-contain dark:hidden"
            priority
          />
          <Image
            src="/auth/logo-full-dark.svg"
            alt="Logo"
            width={160}
            height={48}
            className="w-auto h-full object-contain hidden dark:block"
            priority
          />
        </>
      )}
    </div>
  );
}
