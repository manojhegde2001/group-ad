'use client';

import { ActionIcon as RizzuiActionIcon, type ActionIconProps as RizzuiActionIconProps } from 'rizzui';
import { cn } from '@/lib/utils';

export interface ActionIconProps extends RizzuiActionIconProps {
  className?: string;
}

export function ActionIcon({
  className,
  ...props
}: ActionIconProps) {
  return (
    <RizzuiActionIcon
      className={cn(
        'transition-all active:scale-95',
        className
      )}
      {...props}
    />
  );
}

ActionIcon.displayName = 'ActionIcon';
