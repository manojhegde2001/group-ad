'use client';

import { Badge as RizzuiBadge } from 'rizzui';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'solid' | 'outline' | 'flat';
  color?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'pill';
  className?: string;
}

export function Badge({
  children,
  variant = 'solid',
  color = 'primary',
  size = 'sm',
  rounded = 'md',
  className,
}: BadgeProps) {
  return (
    <RizzuiBadge
      variant={variant}
      color={color}
      size={size}
      rounded={rounded}
      className={cn(className)}
    >
      {children}
    </RizzuiBadge>
  );
}
