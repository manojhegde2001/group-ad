'use client';

import { Avatar as RizzuiAvatar } from 'rizzui';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  color?: 'primary' | 'secondary' | 'danger';
  className?: string;
  initialsClassName?: string;
}

export function Avatar({
  src,
  name = 'User',
  size = 'md',
  rounded = 'full',
  color = 'primary',
  className,
}: AvatarProps) {
  return (
    <RizzuiAvatar
      src={src}
      name={name}
      size={size}
      rounded={rounded}
      color={color}
      className={cn(className)}
    />
  );
}
