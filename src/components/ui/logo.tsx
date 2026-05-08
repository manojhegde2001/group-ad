'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn(
      'relative flex items-center justify-center select-none shrink-0',
      !className?.includes('w-') && (iconOnly ? 'w-10' : 'w-40'),
      !className?.includes('h-') && 'h-10',
      className
    )}>
      {iconOnly ? (
        <>
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
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
