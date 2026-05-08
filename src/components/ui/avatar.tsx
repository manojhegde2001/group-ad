'use client';

import { CloudinaryImage } from './cloudinary-image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full' | 'xl';
  color?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-16 h-16 text-base',
  '2xl': 'w-24 h-24 text-xl',
};

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-2xl',
  full: 'rounded-full',
};

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  rounded = 'full',
  className,
}: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden bg-secondary-100 dark:bg-secondary-800 flex items-center justify-center font-black uppercase tracking-widest text-secondary-400 select-none border border-secondary-100 dark:border-secondary-800',
        sizeClasses[size],
        roundedClasses[rounded],
        className
      )}
    >
      {src ? (
        <CloudinaryImage
          src={src}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
