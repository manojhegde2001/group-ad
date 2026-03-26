'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export default function Logo({ className, iconOnly = false }: LogoProps) {
  if (iconOnly) {
    return (
      <Image
        src="/auth/logo-small.svg"
        alt="Logo"
        width={40}
        height={40}
        className={cn("object-contain shrink-0", className)}
        priority
      />
    );
  }

  return (
    <>
      <Image
        src="/auth/logo-full.svg"
        alt="Logo"
        width={160}
        height={48}
        className={cn("object-contain shrink-0 dark:hidden", className)}
        priority
      />
      <Image
        src="/auth/logo-full-dark.svg"
        alt="Logo"
        width={160}
        height={48}
        className={cn("object-contain shrink-0 hidden dark:block", className)}
        priority
      />
    </>
  );
}
