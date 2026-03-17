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
      'relative flex items-center justify-center group select-none',
      iconOnly ? 'w-10 h-10' : 'w-32 h-10',
      className
    )}>
      {iconOnly ? (
        <Image
          src="/auth/logo-small.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
        />
      ) : (
        <Image
          src="/auth/logo-full.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
        />
      )}
    </div>
  );
}
